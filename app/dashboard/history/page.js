"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Copy, Check, Filter } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/lib/i18n";
import styles from "./history.module.css";

export default function History() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState({});
  const [copied, setCopied] = useState(null);
  const [serviceFilter, setServiceFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("");

  useEffect(() => {
    let url = `/api/history?limit=200`;
    if (serviceFilter) url += `&service=${serviceFilter}`;
    if (tierFilter) url += `&tier=${tierFilter}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setHistory(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session?.user?.id, serviceFilter, tierFilter]);

  const toggleReveal = (id) => {
    setRevealed(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (combo, id) => {
    navigator.clipboard.writeText(combo);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const maskCombo = (combo) => {
    if (!combo || combo.length < 6) return "●●●●●●●●●";
    return combo.substring(0, 3) + "●".repeat(Math.min(combo.length - 6, 20)) + combo.substring(combo.length - 3);
  };

  const getTierClass = (tier) => {
    if (tier === "premium") return styles.tierPremium;
    if (tier === "prime") return styles.tierPrime;
    return styles.tierFree;
  };

  const uniqueServices = [...new Set(history.map(h => h.serviceLabel || h.serviceId))];
  const uniqueTiers = [...new Set(history.map(h => h.tier))];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t("hist_title")}</h1>
          <p className={styles.subtitle}>{t("hist_subtitle")}</p>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <Filter size={14} />
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className={styles.select}
          >
            <option value="">{t("hist_filter_all")}</option>
            {uniqueServices.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className={styles.select}
          >
            <option value="">{t("hist_filter_tier")}</option>
            {uniqueTiers.map(tier => (
              <option key={tier} value={tier}>{tier.toUpperCase()}</option>
            ))}
          </select>
        </div>
        <span className={styles.count}>{history.length} entries</span>
      </div>

      {loading ? (
        <div className={styles.loading}>{t("loading")}</div>
      ) : history.length === 0 ? (
        <div className={styles.empty}>{t("hist_no_history")}</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t("hist_date")}</th>
                <th>{t("hist_service")}</th>
                <th>{t("hist_tier")}</th>
                <th>{t("hist_combo")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry, i) => (
                <motion.tr
                  key={entry.id || i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <td className={styles.date}>
                    {new Date(entry.date).toLocaleDateString()}{" "}
                    <span className={styles.time}>
                      {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className={styles.service}>{entry.serviceLabel || entry.serviceId}</td>
                  <td>
                    <span className={`${styles.tierBadge} ${getTierClass(entry.tier)}`}>
                      {entry.tier?.toUpperCase()}
                    </span>
                  </td>
                  <td className={styles.comboCell}>
                    <code className={styles.combo}>
                      {revealed[entry.id] ? entry.combo : maskCombo(entry.combo)}
                    </code>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.actionBtn}
                        onClick={() => toggleReveal(entry.id)}
                        title={revealed[entry.id] ? t("hist_hide") : t("hist_reveal")}
                      >
                        {revealed[entry.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleCopy(entry.combo, entry.id)}
                        title={t("gen_copy")}
                      >
                        {copied === entry.id ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
