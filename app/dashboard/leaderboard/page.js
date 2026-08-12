"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Zap } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import styles from "./leaderboard.module.css";

export default function Leaderboard() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api-bot/leaderboard")
      .then(res => res.json())
      .then(data => {
        setUsers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getRankStyle = (index) => {
    if (index === 0) return styles.gold;
    if (index === 1) return styles.silver;
    if (index === 2) return styles.bronze;
    return "";
  };

  const getRankIcon = (index) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}`;
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{t("lb_title")}</h1>
      <p className={styles.subtitle}>{t("lb_subtitle")}</p>

      {loading ? (
        <div className={styles.loading}>{t("loading")}</div>
      ) : users.length === 0 ? (
        <div className={styles.empty}>No data yet.</div>
      ) : (
        <>
          {/* Top 3 Podium */}
          <div className={styles.podium}>
            {users.slice(0, 3).map((user, i) => (
              <motion.div
                key={user.userId}
                className={`${styles.podiumCard} ${getRankStyle(i)}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
              >
                <div className={styles.podiumRank}>{getRankIcon(i)}</div>
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} className={styles.podiumAvatar} />
                ) : (
                  <div className={styles.podiumAvatarPlaceholder}>
                    {user.username?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
                <h3 className={styles.podiumName}>{user.username}</h3>
                <div className={styles.podiumCount}>
                  <Zap size={14} />
                  {user.generations.toLocaleString()}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Table */}
          {users.length > 3 && (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{t("lb_rank")}</th>
                    <th>{t("lb_user")}</th>
                    <th>{t("lb_generations")}</th>
                    <th>{t("lb_last_active")}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.slice(3).map((user, i) => (
                    <motion.tr
                      key={user.userId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 + i * 0.03 }}
                    >
                      <td className={styles.rank}>{i + 4}</td>
                      <td>
                        <div className={styles.userCell}>
                          {user.avatar ? (
                            <img src={user.avatar} alt="" className={styles.tableAvatar} />
                          ) : (
                            <div className={styles.tableAvatarPlaceholder}>
                              {user.username?.[0]?.toUpperCase() || "?"}
                            </div>
                          )}
                          <span>{user.username}</span>
                        </div>
                      </td>
                      <td className={styles.genCount}>{user.generations.toLocaleString()}</td>
                      <td className={styles.lastActive}>
                        {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : "—"}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Zap({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
  );
}
