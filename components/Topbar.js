"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Zap, Mail, ShoppingBag, MessageSquare, Trophy, Clock, LogOut, Menu, X, Wrench, Crown, Star, FileText } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useState, useEffect } from "react";
import styles from "./Topbar.module.css";

const routes = [
  { href: "/dashboard", icon: LayoutDashboard, labelKey: "nav_overview" },
  { href: "/dashboard/generators", icon: Zap, labelKey: "nav_generators" },
  { href: "/dashboard/tools", icon: Mail, labelKey: "nav_tools" },
  { href: "/dashboard/shop", icon: ShoppingBag, labelKey: "nav_shop" },
  { href: "/dashboard/tickets", icon: MessageSquare, labelKey: "nav_tickets" },
  { href: "/dashboard/leaderboard", icon: Trophy, labelKey: "nav_leaderboard" },
  { href: "/dashboard/history", icon: Clock, labelKey: "nav_history" },
  { href: "/dashboard/status", icon: Wrench, labelKey: "nav_status" },
  { href: "/dashboard/avis", icon: Star, labelKey: "nav_reviews" },
  { href: "/dashboard/patchnotes", icon: FileText, labelKey: "nav_patchnotes" },
];

export default function Topbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { lang, switchLang, t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (session?.user?.id === "1178305844698435625") {
      setIsAdmin(true);
    } else if (session?.user?.id) {
      fetch("/api-bot/admin/staff")
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data) && data.includes(session.user.id)) {
            setIsAdmin(true);
          }
        }).catch(() => {});
    }
  }, [session?.user?.id]);

  return (
    <>
      <header className={styles.topbar}>
        <div className={styles.inner}>
          {/* Logo */}
          <Link href="/dashboard" className={styles.logo}>
            <span className={styles.logoMain}>Prime</span>
            <span className={styles.logoAccent}>Gen</span>
          </Link>

          {/* Desktop Nav */}
          <nav className={styles.nav}>
            {routes.map((route) => {
              const isActive = pathname === route.href;
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={`${styles.navLink} ${isActive ? styles.active : ""}`}
                >
                  <route.icon size={16} />
                  <span>{t(route.labelKey)}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className={styles.activeIndicator}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
            
            {isAdmin && (
              <Link
                href="/dashboard/admin"
                className={`${styles.navLink} ${pathname === "/dashboard/admin" ? styles.active : ""}`}
                style={{ color: "#ff4785" }}
              >
                <Crown size={16} />
                <span>Panel Admin</span>
              </Link>
            )}
          </nav>

          {/* Right Section */}
          <div className={styles.right}>
            {/* Language Switch */}
            <div className={styles.langSwitch}>
              <button
                className={`${styles.langBtn} ${lang === "en" ? styles.langActive : ""}`}
                onClick={() => switchLang("en")}
              >
                EN
              </button>
              <button
                className={`${styles.langBtn} ${lang === "fr" ? styles.langActive : ""}`}
                onClick={() => switchLang("fr")}
              >
                FR
              </button>
            </div>

            {/* Avatar */}
            {session?.user?.image && (
              <img
                src={session.user.image}
                alt="Avatar"
                className={styles.avatar}
              />
            )}

            {/* Logout */}
            <button className={styles.logoutBtn} onClick={() => signOut({ callbackUrl: "/" })} title={t("nav_logout")}>
              <LogOut size={16} />
            </button>

            {/* Mobile Hamburger */}
            <button className={styles.hamburger} onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className={styles.mobileOverlay}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <nav className={styles.mobileNav}>
              {routes.map((route) => {
                const isActive = pathname === route.href;
                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={`${styles.mobileLink} ${isActive ? styles.active : ""}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <route.icon size={18} />
                    <span>{t(route.labelKey)}</span>
                  </Link>
                );
              })}
              
              {isAdmin && (
                <Link
                  href="/dashboard/admin"
                  className={`${styles.mobileLink} ${pathname === "/dashboard/admin" ? styles.active : ""}`}
                  onClick={() => setMobileOpen(false)}
                  style={{ color: "#ff4785" }}
                >
                  <Crown size={18} />
                  <span>Panel Admin</span>
                </Link>
              )}

              <div className={styles.mobileLangSwitch}>
                <button
                  className={`${styles.langBtn} ${lang === "en" ? styles.langActive : ""}`}
                  onClick={() => { switchLang("en"); setMobileOpen(false); }}
                >
                  EN
                </button>
                <button
                  className={`${styles.langBtn} ${lang === "fr" ? styles.langActive : ""}`}
                  onClick={() => { switchLang("fr"); setMobileOpen(false); }}
                >
                  FR
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
