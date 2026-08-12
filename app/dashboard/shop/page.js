"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { toast } from "react-hot-toast";
import styles from "./shop.module.css";

export default function Shop() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch("/api-bot/shop")
      .then(res => res.json())
      .then(data => {
        setPlans(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t("shop_title")}</h1>
        <p className={styles.subtitle}>{t("shop_subtitle")}</p>
      </div>

      {loading ? (
        <div style={{textAlign: "center", color: "rgba(255,255,255,0.5)", marginTop: "2rem"}}>Chargement...</div>
      ) : plans.length === 0 ? (
        <div style={{textAlign: "center", color: "rgba(255,255,255,0.5)", marginTop: "2rem"}}>Aucun article disponible.</div>
      ) : (
        <div className={styles.grid}>
          {plans.map((plan, i) => (
            <motion.div 
              key={plan.id}
              className={`${styles.card} ${styles[plan.style || 'premium']}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
            >
              {plan.badge && <div className={styles.badge}>{plan.badge}</div>}
              
              <h3 className={styles.tierName}>{plan.name}</h3>
              
              <div className={styles.priceContainer}>
                <span className={styles.currency}>€</span>
                <span className={styles.price}>{plan.price}</span>
              </div>

              <div className={styles.features}>
                {Array.isArray(plan.features) && plan.features.map((feat, j) => (
                  <div key={j} className={styles.feature}>
                    <div className={styles.iconWrapper}>
                      <Check size={14} className={styles.icon} />
                    </div>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              <button className={styles.buyBtn} onClick={() => toast.error("Système de paiement en cours d'intégration.")}>
                Acheter {plan.name}
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
