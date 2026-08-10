"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Copy, Check, X, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/lib/i18n";
import styles from "./generators.module.css";

const CATEGORIES = [
  { key: "all", labelKey: "gen_all" },
  { key: "streaming", labelKey: "gen_streaming", ids: ["paramount", "disney", "netflix", "primevideo", "hbomax", "crunchyroll", "adn", "dazn"] },
  { key: "gaming", labelKey: "gen_gaming", ids: ["fortnite", "valorant", "steam", "epicgames", "battlenet", "xbox", "psn", "roblox", "minecraft", "leagueoflegends", "ea", "ubisoft", "genshin", "rockstar", "nintendo", "fortnite_prime", "valorant_prime"] },
  { key: "music", labelKey: "gen_music", ids: ["spotify", "deezer"] },
  { key: "vpn", labelKey: "gen_vpn", ids: ["nordvpn", "expressvpn", "mullvadvpn", "protonvpn"] },
  { key: "other", labelKey: "gen_other", ids: ["gmail", "hotmail", "duolingo", "mega", "ebay", "paypal", "tiktok", "twitter", "reddit", "patreon", "elevenlabs", "wondershare", "pizzahut"] },
];

export default function Generators() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [genResult, setGenResult] = useState(null);
  const [genLoading, setGenLoading] = useState({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api-bot/services/stock")
      .then(res => res.json())
      .then(data => {
        setServices(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        fetch("/api-bot/services")
          .then(res => res.json())
          .then(data => {
            setServices((Array.isArray(data) ? data : []).map(s => ({ ...s, stock: '?' })));
            setLoading(false);
          })
          .catch(() => setLoading(false));
      });
  }, []);

  const filtered = useMemo(() => {
    let list = services;
    if (activeCategory !== "all") {
      const cat = CATEGORIES.find(c => c.key === activeCategory);
      if (cat?.ids) list = list.filter(s => cat.ids.includes(s.id));
    }
    if (search) {
      list = list.filter(s => s.label.toLowerCase().includes(search.toLowerCase()));
    }
    return list;
  }, [services, activeCategory, search]);

  const handleGenerate = async (service) => {
    if (!session?.user?.id) return;
    setGenLoading(prev => ({ ...prev, [service.id]: true }));

    try {
      const res = await fetch("/api-bot/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: service.id, userId: session.user.id })
      });
      const data = await res.json();
      if (data.error) {
        setGenResult({ error: true, message: data.error, service: service.label });
      } else {
        setGenResult({
          error: false,
          service: data.service,
          combo: data.combo,
          accountInfo: data.accountInfo
        });
        // Update stock locally
        setServices(prev => prev.map(s =>
          s.id === service.id ? { ...s, stock: Math.max(0, (s.stock || 1) - 1) } : s
        ));
      }
    } catch (err) {
      setGenResult({ error: true, message: "Connection error", service: service.label });
    }
    setGenLoading(prev => ({ ...prev, [service.id]: false }));
  };

  const handleCopy = () => {
    if (genResult?.combo) {
      navigator.clipboard.writeText(genResult.combo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getTierClass = (tier) => {
    if (tier === "premium") return styles.tierPremium;
    if (tier === "prime") return styles.tierPrime;
    return styles.tierFree;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t("gen_title")}</h1>
          <p className={styles.subtitle}>{t("gen_subtitle")}</p>
        </div>
        <div className={styles.searchBox}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className={styles.tabs}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            className={`${styles.tab} ${activeCategory === cat.key ? styles.tabActive : ""}`}
            onClick={() => setActiveCategory(cat.key)}
          >
            {t(cat.labelKey)}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className={styles.loading}>{t("loading")}</div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((service, i) => (
            <motion.div
              key={service.id}
              className={styles.card}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03, duration: 0.25 }}
            >
              <div className={styles.cardTop}>
                <img
                  src={service.iconUrl}
                  alt={service.label}
                  className={styles.serviceIcon}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div className={styles.cardInfo}>
                  <h3 className={styles.serviceName}>{service.label}</h3>
                  <div className={styles.cardMeta}>
                    <span className={`${styles.tierBadge} ${getTierClass(service.tier)}`}>
                      {service.tier.toUpperCase()}
                    </span>
                    <span className={styles.stock}>
                      {t("gen_stock")}: <strong>{service.stock ?? '?'}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <button
                className={styles.generateBtn}
                onClick={() => handleGenerate(service)}
                disabled={genLoading[service.id] || service.stock === 0}
              >
                {genLoading[service.id] ? (
                  <span className={styles.btnSpinner}></span>
                ) : service.stock === 0 ? (
                  t("gen_out_of_stock")
                ) : (
                  <>
                    <Zap size={14} />
                    {t("gen_generate")}
                  </>
                )}
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Result Modal */}
      <AnimatePresence>
        {genResult && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setGenResult(null)}
          >
            <motion.div
              className={styles.resultModal}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {genResult.error ? (
                <>
                  <div className={styles.resultIcon + " " + styles.resultError}>
                    <X size={24} />
                  </div>
                  <h3>{t("gen_error")}</h3>
                  <p className={styles.resultMessage}>{genResult.message}</p>
                </>
              ) : (
                <>
                  <div className={styles.resultIcon + " " + styles.resultSuccess}>
                    <Zap size={24} />
                  </div>
                  <h3>{t("gen_success")}</h3>
                  <p className={styles.resultService}>{genResult.service}</p>
                  <div className={styles.comboBox}>
                    <code className={styles.comboText}>{genResult.combo}</code>
                    <button className={styles.copyBtn} onClick={handleCopy}>
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      {copied ? t("gen_copied") : t("gen_copy")}
                    </button>
                  </div>
                  {genResult.accountInfo && (
                    <p className={styles.accountInfo}>{genResult.accountInfo}</p>
                  )}
                </>
              )}
              <button className={styles.closeBtn} onClick={() => setGenResult(null)}>
                {t("gen_close")}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
