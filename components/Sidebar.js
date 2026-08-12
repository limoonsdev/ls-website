"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { LayoutDashboard, Zap, Wrench, ShoppingBag, MessageSquare, LogOut } from "lucide-react";
import styles from "./Sidebar.module.css";

const routes = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/generators", icon: Zap, label: "Generators" },
  { href: "/dashboard/tools", icon: Wrench, label: "PrimeTools" },
  { href: "/dashboard/shop", icon: ShoppingBag, label: "Shop" },
  { href: "/dashboard/tickets", icon: MessageSquare, label: "Tickets" },
  { href: "/dashboard/admin", icon: Wrench, label: "Panel Admin", adminOnly: true },
];

import { useState, useEffect } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isAdmin, setIsAdmin] = useState(session?.user?.id === "1178305844698435625");

  useEffect(() => {
    if (session?.user?.id && session.user.id !== "1178305844698435625") {
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
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <h2>Prime<span className={styles.accent}>Gen</span></h2>
      </div>

      <nav className={styles.nav}>
        {routes.map((route) => {
          if (route.adminOnly && !isAdmin) return null;
          const isActive = pathname === route.href;
          return (
            <Link key={route.href} href={route.href} className={`${styles.link} ${isActive ? styles.active : ""} ${route.adminOnly ? styles.adminLink : ""}`}>
              <route.icon className={styles.icon} />
              {route.label}
              {isActive && (
                <motion.div layoutId="activeNav" className={styles.activeBg} />
              )}
            </Link>
          );
        })}
      </nav>

      <button className={styles.logoutBtn} onClick={() => signOut()}>
        <LogOut className={styles.icon} /> Logout
      </button>
    </aside>
  );
}
