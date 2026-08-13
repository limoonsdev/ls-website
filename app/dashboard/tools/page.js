"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Inbox, Copy, Check, RefreshCw, Plus, Trash2, Eye } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/lib/i18n";
import { toast } from "react-hot-toast";
import styles from "./tools.module.css";

const MAIL_API = "/api/mail";

export default function PrimeMail() {
  const { data: session } = useSession();
  const { t } = useTranslation();

  const [emails, setEmails] = useState([]); // Generated mailboxes
  const [activeEmail, setActiveEmail] = useState(null); // Currently selected mailbox
  const [activeToken, setActiveToken] = useState(null);
  const [inbox, setInbox] = useState([]);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [msgBody, setMsgBody] = useState("");
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(null);
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [domains, setDomains] = useState([]);
  const pollRef = useRef(null);

  // Fetch available domains on mount
  useEffect(() => {
    fetch(`${MAIL_API}/domains`)
      .then(r => r.json())
      .then(data => {
        const domainList = data["hydra:member"] || data;
        setDomains(Array.isArray(domainList) ? domainList : []);
      })
      .catch(() => {});
  }, []);

  // Auto-refresh inbox every 8 seconds when an email is active
  useEffect(() => {
    if (activeToken && activeEmail) {
      pollRef.current = setInterval(() => {
        fetchInbox(activeToken, true);
      }, 8000);
    }
    return () => clearInterval(pollRef.current);
  }, [activeToken, activeEmail]);

  const generateRandomString = (len = 10) => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < len; i++) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
  };

  const createMailbox = async () => {
    setCreating(true);
    try {
      let currentDomains = domains;
      if (currentDomains.length === 0) {
        const r = await fetch(`${MAIL_API}/domains`);
        const data = await r.json();
        currentDomains = Array.isArray(data["hydra:member"] || data) ? (data["hydra:member"] || data) : [];
        setDomains(currentDomains);
      }
      if (currentDomains.length === 0) {
        setCreating(false);
        return;
      }
      const domain = currentDomains[0].domain || currentDomains[0];
      const address = `${generateRandomString(12)}@${domain}`;
      const password = generateRandomString(16);

      // Create account
      const createRes = await fetch(`${MAIL_API}/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, password }),
      });

      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        console.error("Create failed:", err);
        setCreating(false);
        return;
      }

      // Login to get token
      const loginRes = await fetch(`${MAIL_API}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, password }),
      });

      if (!loginRes.ok) {
        setCreating(false);
        return;
      }

      const loginData = await loginRes.json();
      const token = loginData.token;

      const newEntry = { address, password, token, createdAt: new Date().toISOString() };
      setEmails(prev => [newEntry, ...prev]);
      setActiveEmail(address);
      setActiveToken(token);
      setInbox([]);
      setSelectedMsg(null);
    } catch (err) {
      console.error("Mail creation error:", err);
      toast.error("Erreur réseau. Désactivez votre bloqueur de publicités pour utiliser le Temp Mail.");
    }
    setCreating(false);
  };

  const fetchInbox = async (token, silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await fetch(`${MAIL_API}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const messages = data["hydra:member"] || data;
        setInbox(Array.isArray(messages) ? messages : []);
      }
    } catch (e) {
      console.error("Inbox fetch error:", e);
    }
    if (!silent) setRefreshing(false);
  };

  const selectMailbox = (email) => {
    setActiveEmail(email.address);
    setActiveToken(email.token);
    setSelectedMsg(null);
    setMsgBody("");
    fetchInbox(email.token);
  };

  const openMessage = async (msg) => {
    setSelectedMsg(msg);
    setLoadingMsg(true);
    try {
      const res = await fetch(`${MAIL_API}/messages/${msg.id}`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMsgBody(data.html?.[0] || data.text || "No content");
      }
    } catch (e) {
      setMsgBody("Failed to load message.");
    }
    setLoadingMsg(false);
  };

  const deleteMailbox = (address) => {
    setEmails(prev => prev.filter(e => e.address !== address));
    if (activeEmail === address) {
      setActiveEmail(null);
      setActiveToken(null);
      setInbox([]);
      setSelectedMsg(null);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // Extract OTP codes from message
  const extractOTP = (text) => {
    if (!text) return null;
    const otpMatch = text.match(/\b(\d{4,8})\b/);
    return otpMatch ? otpMatch[1] : null;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <Mail size={28} className={styles.titleIcon} />
            PrimeMail
          </h1>
          <p className={styles.subtitle}>{t("primemail_subtitle")}</p>
        </div>
        <button 
          className={styles.createBtn} 
          onClick={createMailbox} 
          disabled={creating}
        >
          {creating ? (
            <span className={styles.spinner}></span>
          ) : (
            <>
              <Plus size={16} />
              {t("primemail_create")}
            </>
          )}
        </button>
      </div>

      <div className={styles.layout}>
        {/* Left: Mailbox list */}
        <div className={styles.mailboxList}>
          <h3 className={styles.panelTitle}>{t("primemail_mailboxes")}</h3>
          {emails.length === 0 ? (
            <div className={styles.emptyState}>
              <Mail size={32} className={styles.emptyIcon} />
              <p>{t("primemail_no_mailbox")}</p>
            </div>
          ) : (
            <div className={styles.emailList}>
              {emails.map((email) => (
                <div
                  key={email.address}
                  className={`${styles.emailItem} ${activeEmail === email.address ? styles.emailActive : ""}`}
                  onClick={() => selectMailbox(email)}
                >
                  <div className={styles.emailInfo}>
                    <span className={styles.emailAddress}>{email.address}</span>
                    <span className={styles.emailTime}>
                      {new Date(email.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className={styles.emailActions}>
                    <button
                      className={styles.iconBtn}
                      onClick={(e) => { e.stopPropagation(); copyToClipboard(email.address, email.address); }}
                      title="Copy"
                    >
                      {copied === email.address ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <button
                      className={styles.iconBtn}
                      onClick={(e) => { e.stopPropagation(); deleteMailbox(email.address); }}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Inbox */}
        <div className={styles.inboxPanel}>
          {!activeEmail ? (
            <div className={styles.inboxEmpty}>
              <Inbox size={40} className={styles.emptyIcon} />
              <p>{t("primemail_select_mailbox")}</p>
            </div>
          ) : selectedMsg ? (
            /* Message View */
            <div className={styles.messageView}>
              <div className={styles.messageHeader}>
                <button className={styles.backBtn} onClick={() => { setSelectedMsg(null); setMsgBody(""); }}>
                  ← {t("primemail_back")}
                </button>
                {(() => {
                  const otp = extractOTP(msgBody);
                  return otp ? (
                    <div className={styles.otpBanner}>
                      <span className={styles.otpLabel}>OTP Detected:</span>
                      <code className={styles.otpCode}>{otp}</code>
                      <button
                        className={styles.iconBtn}
                        onClick={() => copyToClipboard(otp, "otp")}
                      >
                        {copied === "otp" ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  ) : null;
                })()}
              </div>
              <div className={styles.msgMeta}>
                <strong>{selectedMsg.subject || "(No Subject)"}</strong>
                <span>From: {selectedMsg.from?.address || "Unknown"}</span>
              </div>
              {loadingMsg ? (
                <div className={styles.loadingMsg}>{t("loading")}</div>
              ) : (
                <div
                  className={styles.msgBody}
                  dangerouslySetInnerHTML={{ __html: msgBody }}
                />
              )}
            </div>
          ) : (
            /* Inbox List */
            <>
              <div className={styles.inboxHeader}>
                <h3 className={styles.panelTitle}>
                  <Inbox size={16} /> Inbox — <code className={styles.activeAddr}>{activeEmail}</code>
                </h3>
                <button 
                  className={styles.refreshBtn} 
                  onClick={() => fetchInbox(activeToken)}
                  disabled={refreshing}
                >
                  <RefreshCw size={14} className={refreshing ? styles.spinning : ""} />
                  {t("primemail_refresh")}
                </button>
              </div>

              {inbox.length === 0 ? (
                <div className={styles.inboxEmpty}>
                  <p>{t("primemail_no_emails")}</p>
                  <span className={styles.waitingDots}>{t("primemail_waiting")}</span>
                </div>
              ) : (
                <div className={styles.inboxList}>
                  {inbox.map((msg) => {
                    const otp = extractOTP(msg.intro || msg.subject || "");
                    return (
                      <motion.div
                        key={msg.id}
                        className={styles.inboxItem}
                        onClick={() => openMessage(msg)}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <div className={styles.msgLeft}>
                          <span className={styles.msgFrom}>{msg.from?.address || "Unknown"}</span>
                          <span className={styles.msgSubject}>{msg.subject || "(No Subject)"}</span>
                          <span className={styles.msgPreview}>{msg.intro || ""}</span>
                        </div>
                        <div className={styles.msgRight}>
                          {otp && (
                            <span className={styles.otpTag} onClick={(e) => { e.stopPropagation(); copyToClipboard(otp, msg.id); }}>
                              {copied === msg.id ? "Copied!" : `OTP: ${otp}`}
                            </span>
                          )}
                          <Eye size={14} />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
