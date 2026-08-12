"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Wrench } from "lucide-react";
import { motion } from "framer-motion";
import styles from "./MaintenanceWrapper.module.css";

export default function MaintenanceWrapper({ children }) {
  const { data: session, status } = useSession();
  const [maintenance, setMaintenance] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api-bot/admin/maintenance")
      .then(res => {
        if (!res.ok) throw new Error("API down");
        return res.json();
      })
      .then(data => {
        if (data.maintenance) {
          setMaintenance(true);
          setMessage(data.message);
        }
        
        if (session?.user?.id === "1178305844698435625") {
          setIsAdmin(true);
          setLoading(false);
        } else if (session?.user?.id) {
          fetch("/api-bot/admin/staff")
            .then(r => r.json())
            .then(staffData => {
              if (Array.isArray(staffData) && staffData.includes(session.user.id)) {
                setIsAdmin(true);
              }
              setLoading(false);
            }).catch(() => setLoading(false));
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        // If we can't reach the backend, we assume no maintenance or backend is down.
        setLoading(false);
      });
  }, [session?.user?.id]);

  // While checking session or fetching maintenance state
  if (status === "loading" || loading) {
    return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#00f0ff" }}>Chargement...</div>;
  }

  if (maintenance && !isAdmin) {
    return (
      <div className={styles.maintenanceContainer}>
        <div className={styles.maintenanceGlow}></div>
        <motion.div 
          className={styles.maintenanceBox}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className={styles.iconWrapper}>
            <Wrench size={64} className={styles.maintenanceIcon} />
            <div className={styles.iconPulse}></div>
          </div>
          <h1 className={styles.maintenanceTitle}>PrimeGen est en Maintenance</h1>
          <p className={styles.maintenanceMessage}>{message}</p>
          <div className={styles.loadingBar}>
            <div className={styles.loadingProgress}></div>
          </div>
        </motion.div>
      </div>
    );
  }

  return children;
}
