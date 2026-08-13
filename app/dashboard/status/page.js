"use client";

import { secureFetch } from "@/lib/crypto";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, Server, Database, Globe, ShieldCheck, Zap } from "lucide-react";
import styles from "./status.module.css";

export default function StatusPage() {
  const [status, setStatus] = useState({
    api: "checking",
    database: "checking",
    discord: "checking",
    ping: 0,
    uptime: "0h 0m",
    version: "2.5.0"
  });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await secureFetch("/api-bot/status");
        if (res.ok) {
          const data = await res.json();
          setStatus({
            api: data.api,
            database: data.database,
            discord: data.discord,
            ping: data.ping,
            uptime: data.uptime,
            version: data.version
          });
        }
      } catch (err) {
        setStatus(prev => ({
          ...prev,
          api: "outage",
          database: "outage",
          discord: "outage",
          ping: 999
        }));
      }
    };
    
    checkStatus();
    // Fetch every 5 minutes
    const interval = setInterval(checkStatus, 300000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (state) => {
    if (state === "operational") return styles.statusGreen;
    if (state === "degraded") return styles.statusYellow;
    if (state === "checking") return styles.statusGray;
    return styles.statusRed;
  };

  const getStatusText = (state) => {
    if (state === "operational") return "Opérationnel";
    if (state === "degraded") return "Perturbé";
    if (state === "checking") return "Vérification...";
    return "Hors Ligne";
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <Activity size={28} className={styles.titleIcon} /> Status Technique
        </h1>
        <p className={styles.subtitle}>État des systèmes PrimeGen en temps réel.</p>
      </div>

      <div className={styles.grid}>
        {/* Global Status */}
        <motion.div 
          className={`${styles.card} ${styles.mainCard}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.mainStatus}>
            <div className={`${styles.statusDot} ${status.api === "operational" ? styles.pulseGreen : styles.pulseRed}`} />
            <h2>{status.api === "operational" ? "Tous les systèmes sont opérationnels" : "Problème détecté"}</h2>
          </div>
          <p className={styles.lastCheck}>Dernière vérification: il y a quelques secondes</p>
        </motion.div>

        {/* Services */}
        <div className={styles.servicesGrid}>
          <motion.div className={styles.serviceCard} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <div className={styles.serviceIcon}><Server size={20} /></div>
            <div className={styles.serviceInfo}>
              <h3>API Backend</h3>
              <span className={`${styles.badge} ${getStatusColor(status.api)}`}>{getStatusText(status.api)}</span>
            </div>
          </motion.div>

          <motion.div className={styles.serviceCard} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <div className={styles.serviceIcon}><Database size={20} /></div>
            <div className={styles.serviceInfo}>
              <h3>Base de Données</h3>
              <span className={`${styles.badge} ${getStatusColor(status.database)}`}>{getStatusText(status.database)}</span>
            </div>
          </motion.div>

          <motion.div className={styles.serviceCard} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <div className={styles.serviceIcon}><Globe size={20} /></div>
            <div className={styles.serviceInfo}>
              <h3>Bot Discord</h3>
              <span className={`${styles.badge} ${getStatusColor(status.discord)}`}>{getStatusText(status.discord)}</span>
            </div>
          </motion.div>
        </div>

        {/* Metrics */}
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <h4><Zap size={16} /> Latence API</h4>
            <div className={styles.metricValue}>{status.ping} <span className={styles.unit}>ms</span></div>
          </div>
          <div className={styles.metricCard}>
            <h4><ShieldCheck size={16} /> Uptime (90j)</h4>
            <div className={styles.metricValue}>{status.uptime}</div>
          </div>
          <div className={styles.metricCard}>
            <h4><Server size={16} /> Version</h4>
            <div className={styles.metricValue}>{status.version}</div>
          </div>
        </div>
      </div>
    </div>
  );
}


