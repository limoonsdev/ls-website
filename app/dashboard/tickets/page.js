"use client";

import { secureFetch } from "@/lib/crypto";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Plus, ArrowLeft, Lock, MessageSquare } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/lib/i18n";
import styles from "./tickets.module.css";

export default function Tickets() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTicket, setActiveTicket] = useState(null); // ID of selected channel
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [msgLoading, setMsgLoading] = useState(false);
  
  const [creating, setCreating] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("General");
  const [desc, setDesc] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // Fetch list of tickets
  const fetchTickets = () => {
    fetch(`/api/tickets`)
      .then(res => res.json())
      .then(data => {
        setTickets(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets();
  }, [session?.user?.id]);

  // Fetch messages for active ticket
  useEffect(() => {
    if (!activeTicket || !session?.user?.id) return;
    
    const fetchMsgs = () => {
      fetch(`/api/tickets/${activeTicket}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setMessages(data);
        })
        .catch(console.error);
    };
    
    fetchMsgs();
    const interval = setInterval(fetchMsgs, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [activeTicket, session?.user?.id]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleCreate = async () => {
    if (!subject || !desc || !session?.user?.id) return;
    setCreateLoading(true);
    
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          username: session.user.name,
          subject,
          category,
          message: desc
        })
      });
      const data = await res.json();
      if (data.channelId) {
        setCreating(false);
        setSubject("");
        setDesc("");
        fetchTickets();
        setActiveTicket(data.channelId);
      }
    } catch(err) {
      console.error(err);
    }
    setCreateLoading(false);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !activeTicket) return;
    setMsgLoading(true);
    
    const text = newMessage;
    setNewMessage(""); // Optimistic clear
    
    try {
      await secureFetch(`/api-bot/tickets/${activeTicket}/reply`, 'POST', {
        userId: session.user.id,
        username: session.user.name,
        message: text
      });
      // Fetch immediately to show the new message
      const res = await secureFetch(`/api-bot/tickets/${session?.user?.id}/${activeTicket}`);
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data);
    } catch(err) {
      console.error(err);
      setNewMessage(text); // Restore on error
    }
    setMsgLoading(false);
  };

  const handleCloseTicket = async () => {
    if (!activeTicket) return;
    try {
      await secureFetch(`/api-bot/tickets/${activeTicket}/close`, 'POST');
      fetchTickets();
      const t = tickets.find(t => t.channelId === activeTicket);
      if (t) t.status = 'closed';
      setTickets([...tickets]);
    } catch(err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'open') return <span className={`${styles.badge} ${styles.badgeOpen}`}>{t("tickets_open")}</span>;
    if (status === 'closed') return <span className={`${styles.badge} ${styles.badgeClosed}`}>{t("tickets_closed")}</span>;
    return <span className={`${styles.badge} ${styles.badgePending}`}>{t("tickets_pending")}</span>;
  };

  if (activeTicket) {
    const currentTicket = tickets.find(t => t.channelId === activeTicket);
    const isClosed = currentTicket?.status === 'closed';

    return (
      <div className={styles.container}>
        <button className={styles.backBtn} onClick={() => setActiveTicket(null)}>
          <ArrowLeft size={16} /> {t("tickets_back")}
        </button>
        
        <div className={styles.chatContainer}>
          <div className={styles.chatHeader}>
            <div>
              <h2 className={styles.chatTitle}>{currentTicket?.subject || 'Ticket'}</h2>
              <div className={styles.chatMeta}>
                {getStatusBadge(currentTicket?.status)}
                <span className={styles.chatCategory}>{currentTicket?.category}</span>
              </div>
            </div>
            {!isClosed && (
              <button className={styles.closeBtn} onClick={handleCloseTicket}>
                <Lock size={14} /> {t("tickets_close_ticket")}
              </button>
            )}
          </div>
          
          <div className={styles.messagesList}>
            {messages.map((msg, i) => {
              // msg.isStaff implies they are answering from discord
              const isMine = !msg.isStaff;
              
              // Try to remove [WEB] prefix for my messages if present in raw content
              let displayContent = msg.content;
              if (isMine && displayContent.startsWith('[WEB]')) {
                 const split = displayContent.split('**:**');
                 if (split.length > 1) displayContent = split.slice(1).join('**:**').trim();
              }

              return (
                <div key={msg.id || i} className={`${styles.msgWrapper} ${isMine ? styles.msgMine : styles.msgStaff}`}>
                  {!isMine && msg.avatar && (
                    <img src={msg.avatar} alt="" className={styles.msgAvatar} />
                  )}
                  <div className={styles.msgContent}>
                    <div className={styles.msgBubble}>
                      {displayContent}
                    </div>
                    <div className={styles.msgMeta}>
                      {isMine ? t("tickets_you") : msg.author} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
          
          <div className={styles.chatInput}>
            {isClosed ? (
              <div className={styles.closedNote}>This ticket is closed.</div>
            ) : (
              <>
                <input 
                  type="text" 
                  placeholder={t("tickets_type_message")}
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  disabled={msgLoading}
                />
                <button 
                  className={styles.sendBtn} 
                  onClick={handleSend}
                  disabled={msgLoading || !newMessage.trim()}
                >
                  <Send size={18} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t("tickets_title")}</h1>
          <p className={styles.subtitle}>{t("tickets_subtitle")}</p>
        </div>
        <button className={styles.newBtn} onClick={() => setCreating(true)}>
          <Plus size={16} /> {t("tickets_new")}
        </button>
      </div>

      <AnimatePresence>
        {creating && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCreating(false)}
          >
            <motion.div 
              className={styles.modalContent}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <h2 className={styles.modalTitle}>{t("tickets_new")}</h2>
              
              <div className={styles.formGroup}>
                <label>{t("tickets_subject")}</label>
                <input 
                  className={styles.input} 
                  value={subject} 
                  onChange={e => setSubject(e.target.value)} 
                  placeholder={t("tickets_subject")}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>{t("tickets_category")}</label>
                <select 
                  className={styles.select}
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  <option value="General">{t("tickets_cat_general")}</option>
                  <option value="Billing">{t("tickets_cat_billing")}</option>
                  <option value="Bug Report">{t("tickets_cat_bug")}</option>
                  <option value="Other">{t("tickets_cat_other")}</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>{t("tickets_describe")}</label>
                <textarea 
                  className={styles.textarea} 
                  value={desc} 
                  onChange={e => setDesc(e.target.value)} 
                  placeholder={t("tickets_describe")}
                  rows={4}
                />
              </div>
              
              <div className={styles.modalActions}>
                <button className="btn-ghost" onClick={() => setCreating(false)}>{t("gen_close")}</button>
                <button 
                  className="btn-primary" 
                  onClick={handleCreate}
                  disabled={!subject || !desc || createLoading}
                >
                  {createLoading ? t("tickets_creating") : t("tickets_create")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className={styles.loading}>{t("loading")}</div>
      ) : tickets.length === 0 ? (
        <div className={styles.emptyCard}>
          <MessageSquare size={32} className={styles.emptyIcon} />
          <h3>{t("tickets_no_tickets")}</h3>
        </div>
      ) : (
        <div className={styles.ticketList}>
          {tickets.map(ticket => (
            <motion.div 
              key={ticket.id} 
              className={styles.ticketCard}
              whileHover={{ scale: 1.01 }}
              onClick={() => setActiveTicket(ticket.channelId)}
            >
              <div className={styles.ticketTop}>
                <h3 className={styles.ticketSubject}>{ticket.subject}</h3>
                {getStatusBadge(ticket.status)}
              </div>
              <div className={styles.ticketMid}>
                <span className={styles.ticketCategory}>{ticket.category}</span>
                <span className={styles.ticketDate}>
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className={styles.ticketBottom}>
                {ticket.lastMessage ? (
                  <p className={styles.lastMessagePreview}>
                    <strong>{ticket.lastMessage.author}:</strong> {ticket.lastMessage.content}
                  </p>
                ) : (
                  <p className={styles.lastMessagePreview}>No messages yet.</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}



