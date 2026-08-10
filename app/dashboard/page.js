"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, Users, Package, Clock, Trophy, ArrowRight, TrendingUp } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/lib/i18n";
import Link from "next/link";
import styles from "./overview.module.css";

export default function Overview() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [recentHistory, setRecentHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, lbRes] = await Promise.all([
          fetch("/api-bot/stats").then(r => r.json()).catch(() => null),
          fetch("/api-bot/leaderboard").then(r => r.json()).catch(() => []),
        ]);
        setStats(statsRes);
        setLeaderboard(Array.isArray(lbRes) ? lbRes.slice(0, 5) : []);

        if (session?.user?.id) {
          const histRes = await fetch(`/api-bot/history/${session.user.id}?limit=5`).then(r => r.json()).catch(() => []);
          setRecentHistory(Array.isArray(histRes) ? histRes : []);
        }
      } catch (e) {
        console.error("Overview fetch error", e);
      }
      setLoading(false);
    };
    fetchAll();
  }, [session?.user?.id]);

  const statCards = [
    { label: t("landing_users"), value: stats?.users || "—", icon: Users, color: "#ff1744" },
    { label: t("landing_services"), value: stats?.services || "—", icon: Package, color: "#ff616f" },
    { label: t("landing_generated"), value: stats?.generated || "—", icon: Zap, color: "#ff1744" },
  ];

  const getRankIcon = (i) => {
    if (i === 0) return "🥇";
    if (i === 1) return "🥈";
    if (i === 2) return "🥉";
    return `${i + 1}`;
  };

  const maskCombo = (combo) => {
    if (!combo || combo.length < 6) return "●●●●●●●●●";
    return combo.substring(0, 3) + "●".repeat(Math.min(combo.length - 6, 12)) + combo.substring(combo.length - 3);
  };

  return (
    <div className={styles.container}>
      {/* Welcome */}
      <motion.div 
        className={styles.welcome}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className={styles.welcomeTitle}>
          {t("overview_welcome")}{session?.user?.name ? `, ${session.user.name}` : ""} 👋
        </h1>
        <p className={styles.welcomeSubtitle}>{t("overview_subtitle")}</p>
      </motion.div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            className={styles.statCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className={styles.statIcon} style={{ background: `${stat.color}15`, color: stat.color }}>
              <stat.icon size={22} />
            </div>
            <div>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Two column layout */}
      <div className={styles.columns}>
        {/* Mini Leaderboard */}
        <motion.div 
          className={styles.section}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Trophy size={18} />
              {t("nav_leaderboard")}
            </h2>
            <Link href="/dashboard/leaderboard" className={styles.seeAll}>
              {t("overview_see_all")} <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className={styles.sectionLoading}>{t("loading")}</div>
          ) : leaderboard.length === 0 ? (
            <div className={styles.sectionEmpty}>{t("overview_no_data")}</div>
          ) : (
            <div className={styles.lbList}>
              {leaderboard.map((user, i) => (
                <div key={user.userId} className={styles.lbItem}>
                  <span className={styles.lbRank}>{getRankIcon(i)}</span>
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className={styles.lbAvatar} crossOrigin="anonymous" />
                  ) : (
                    <div className={styles.lbAvatarPlaceholder}>
                      {user.username?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                  <span className={styles.lbName}>{user.username}</span>
                  <span className={styles.lbGens}>
                    <Zap size={12} /> {user.generations?.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent History */}
        <motion.div
          className={styles.section}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Clock size={18} />
              {t("overview_recent")}
            </h2>
            <Link href="/dashboard/history" className={styles.seeAll}>
              {t("overview_see_all")} <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className={styles.sectionLoading}>{t("loading")}</div>
          ) : recentHistory.length === 0 ? (
            <div className={styles.sectionEmpty}>{t("hist_no_history")}</div>
          ) : (
            <div className={styles.histList}>
              {recentHistory.map((entry, i) => (
                <div key={entry.id || i} className={styles.histItem}>
                  <div className={styles.histLeft}>
                    <span className={styles.histService}>{entry.serviceLabel || entry.serviceId}</span>
                    <span className={styles.histDate}>
                      {new Date(entry.date).toLocaleDateString()} · {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <code className={styles.histCombo}>{maskCombo(entry.combo)}</code>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div 
        className={styles.quickActions}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Link href="/dashboard/generators" className={styles.quickBtn}>
          <Zap size={18} />
          {t("nav_generators")}
        </Link>
        <Link href="/dashboard/tools" className={styles.quickBtn}>
          <TrendingUp size={18} />
          PrimeMail
        </Link>
      </motion.div>
    </div>
  );
}
