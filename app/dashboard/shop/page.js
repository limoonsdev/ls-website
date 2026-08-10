"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import styles from "./shop.module.css";

export default function Shop() {
  const { t } = useTranslation();
  
  const plans = [
    {
      id: "premium",
      name: "Premium",
      price: "4.99",
      features: t("shop_features_premium"),
      style: "premium"
    },
    {
      id: "prime",
      name: "Prime",
      price: "9.99",
      features: t("shop_features_prime"),
      style: "prime",
      badge: t("shop_best")
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t("shop_title")}</h1>
        <p className={styles.subtitle}>{t("shop_subtitle")}</p>
      </div>

      <div className={styles.grid}>
        {plans.map((plan, i) => (
          <motion.div 
            key={plan.id}
            className={`${styles.card} ${styles[plan.style]}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
          >
            {plan.badge && <div className={styles.badge}>{plan.badge}</div>}
            
            <h3 className={styles.tierName}>{plan.name}</h3>
            
            <div className={styles.priceContainer}>
              <span className={styles.currency}>€</span>
              <span className={styles.price}>{plan.price}</span>
              <span className={styles.period}>{t("shop_month")}</span>
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

            <button className={styles.buyBtn}>
              {t("shop_purchase")} {plan.name}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
