"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Zap, Wrench, ShoppingBag, MessageSquare, Trophy, Clock, LogOut, Menu, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useState } from "react";
import styles from "./Topbar.module.css";

const routes = [
  { href: "/dashboard", icon: LayoutDashboard, labelKey: "nav_overview" },
  { href: "/dashboard/generators", icon: Zap, labelKey: "nav_generators" },
  { href: "/dashboard/tools", icon: Wrench, labelKey: "nav_tools" },
  { href: "/dashboard/shop", icon: ShoppingBag, labelKey: "nav_shop" },
  { href: "/dashboard/tickets", icon: MessageSquare, labelKey: "nav_tickets" },
  { href: "/dashboard/leaderboard", icon: Trophy, labelKey: "nav_leaderboard" },
  { href: "/dashboard/history", icon: Clock, labelKey: "nav_history" },
];

export default function Topbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { lang, switchLang, t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

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
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
