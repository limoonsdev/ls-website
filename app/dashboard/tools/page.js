"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Mail, Key, ShieldAlert } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/lib/i18n";
import styles from "./tools.module.css";

export default function PrimeTools() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  
  const [inputs, setInputs] = useState({ discord_token: "", discord_age: "" });
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});

  const tools = [
    { 
      id: "discord_token", 
      title: "Token Checker", 
      desc: "Extract the User ID from a Discord Token.", 
      icon: Key, 
      requiresInput: true, 
      placeholder: "Paste Discord Token..." 
    },
    { 
      id: "discord_age", 
      title: "ID to Age", 
      desc: "Find out when a Discord account was created from its ID.", 
      icon: Search, 
      requiresInput: true, 
      placeholder: "Paste User ID..." 
    },
    { 
      id: "tempmail", 
      title: "Temp Mail Generator", 
      desc: "Generate a fresh temporary email instantly.", 
      icon: Mail, 
      requiresInput: false 
    }
  ];

  const handleAction = async (toolId) => {
    if (!session?.user?.id) return;
    setLoading(prev => ({...prev, [toolId]: true}));
    setResults(prev => ({...prev, [toolId]: null})); // Clear previous

    try {
      const res = await fetch(`/api-bot/tools/${toolId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id, input: inputs[toolId] })
      });
      const data = await res.json();
      
      if (res.status === 403) {
        setResults(prev => ({...prev, [toolId]: { error: true, text: "Requires VIP Role." }}));
      } else if (data.error) {
        setResults(prev => ({...prev, [toolId]: { error: true, text: data.error }}));
      } else {
        setResults(prev => ({...prev, [toolId]: { error: false, text: data.result, link: data.link }}));
      }
    } catch(err) {
      setResults(prev => ({...prev, [toolId]: { error: true, text: "Failed to connect to backend." }}));
    }
    setLoading(prev => ({...prev, [toolId]: false}));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          {t("tools_title")}
          <span className={styles.vipBadge}>
            <ShieldAlert size={14} />
            {t("tools_vip")}
          </span>
        </h1>
      </div>
      
      <div className={styles.grid}>
        {tools.map((tool, i) => (
          <motion.div 
            key={tool.id} 
            className={styles.card}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className={styles.cardHeader}>
              <div className={styles.iconWrapper}>
                <tool.icon className={styles.icon} size={20} />
              </div>
              <h3 className={styles.cardTitle}>{tool.title}</h3>
            </div>
            
            <p className={styles.description}>{tool.desc}</p>
            
            {tool.requiresInput && (
              <input 
                type="text" 
                className={styles.input} 
                placeholder={tool.placeholder}
                value={inputs[tool.id] || ""}
                onChange={e => setInputs({...inputs, [tool.id]: e.target.value})}
              />
            )}
            
            <button 
              className={styles.actionBtn}
              onClick={() => handleAction(tool.id)}
              disabled={loading[tool.id] || (tool.requiresInput && !inputs[tool.id])}
            >
              {loading[tool.id] ? (
                <div className={styles.spinner}></div>
              ) : (
                t("tools_execute")
              )}
            </button>

            <AnimatePresence>
              {results[tool.id] && (
                <motion.div 
                  className={`${styles.resultBox} ${results[tool.id].error ? styles.resultError : styles.resultSuccess}`}
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                >
                  <p>{results[tool.id].text}</p>
                  {results[tool.id].link && (
                    <a 
                      href={results[tool.id].link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.resultLink}
                    >
                      Open Inbox
                    </a>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
