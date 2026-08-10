"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Database, Users, ShieldAlert, Settings, Package, 
  Plus, Trash2, Search, RefreshCw, BarChart3, 
  MessageSquare, Crown, AlertTriangle, CheckCircle
} from "lucide-react";
import styles from "./admin.module.css";

const ADMIN_ID = "1178305844698435625";

export default function AdminPanel() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState("overview");
  const [services, setServices] = useState([]);
  const [users, setUsers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  if (status === "loading") return null;
  if (session?.user?.id !== ADMIN_ID) {
    redirect("/dashboard/generators");
  }

  const showNotif = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const [staffIds, setStaffIds] = useState([]);
  const [newStaffId, setNewStaffId] = useState("");

  useEffect(() => {
    Promise.all([
      fetch('/api-bot/services').then(r => r.ok ? r.json() : []),
      fetch('/api-bot/leaderboard').then(r => r.ok ? r.json() : []),
      fetch('/api-bot/chat/general').then(r => r.ok ? r.json() : []),
      fetch('/api-bot/admin/staff').then(r => r.ok ? r.json() : []),
    ]).then(([s, u, c, st]) => {
      setServices(Array.isArray(s) ? s : []);
      setUsers(Array.isArray(u) ? u : []);
      setChatMessages(Array.isArray(c) ? c : []);
      setStaffIds(Array.isArray(st) ? st : ["1178305844698435625"]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const saveStaffIds = async (newIds) => {
    try {
      const res = await fetch('/api-bot/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffIds: newIds })
      });
      if (res.ok) {
        setStaffIds(newIds);
        showNotif("Staff mis à jour !");
      }
    } catch(e) {
      showNotif("Erreur de sauvegarde", "error");
    }
  };

  const addStaffId = () => {
    if (!newStaffId.trim() || staffIds.includes(newStaffId.trim())) return;
    saveStaffIds([...staffIds, newStaffId.trim()]);
    setNewStaffId("");
  };

  const removeStaffId = (id) => {
    if (id === "1178305844698435625") return; // Prevent removing super admin
    saveStaffIds(staffIds.filter(sId => sId !== id));
  };

  const totalStock = services.reduce((acc, s) => acc + (s.stock || 0), 0);
  const activeServices = services.filter(s => s.stock > 0).length;

  const tabs = [
    { id: "overview", label: "Vue d'ensemble", icon: BarChart3 },
    { id: "stocks", label: "Stocks", icon: Database },
    { id: "users", label: "Utilisateurs", icon: Users },
    { id: "chat", label: "Modération Chat", icon: MessageSquare },
    { id: "config", label: "Configuration", icon: Settings },
  ];

  return (
    <div className={styles.container}>
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            className={`${styles.notif} ${styles[notification.type]}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {notification.type === "success" ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            {notification.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Panel Admin</h1>
          <p className={styles.subtitle}>Gestion complète de PrimeGen.eu</p>
        </div>
        <div className={styles.adminBadge}>
          <Crown size={16} /> Super Admin
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {tabs.map(tab => (
          <button 
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={18} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className={styles.content}>
        
        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}><Package size={24} /></div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>{totalStock.toLocaleString()}</span>
                  <span className={styles.statLabel}>Comptes en stock</span>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{background:"rgba(255,71,133,0.1)", color:"#ff4785"}}><Database size={24} /></div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>{activeServices}</span>
                  <span className={styles.statLabel}>Services actifs</span>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{background:"rgba(77,166,255,0.1)", color:"#4da6ff"}}><Users size={24} /></div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>{users.length}</span>
                  <span className={styles.statLabel}>Top utilisateurs</span>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{background:"rgba(0,255,136,0.1)", color:"#00ff88"}}><MessageSquare size={24} /></div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>{chatMessages.length}</span>
                  <span className={styles.statLabel}>Messages chat</span>
                </div>
              </div>
            </div>

            <div className={styles.quickSection}>
              <h3>Services les plus populaires</h3>
              <div className={styles.popularList}>
                {services.filter(s => s.stock > 0).sort((a,b) => b.stock - a.stock).slice(0,6).map(s => (
                  <div key={s.id} className={styles.popularItem}>
                    <img src={s.iconUrl || s.image} alt={s.label} className={styles.popularIcon} />
                    <span className={styles.popularName}>{s.label}</span>
                    <span className={styles.popularStock}>{s.stock.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── STOCKS ── */}
        {activeTab === "stocks" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className={styles.sectionHeader}>
              <h3>Tous les services ({services.length})</h3>
              <button className={styles.refreshBtn} onClick={() => {
                fetch('/api-bot/services').then(r => r.json()).then(d => { setServices(d); showNotif("Stocks actualisés !"); });
              }}>
                <RefreshCw size={16} /> Actualiser
              </button>
            </div>
            <div className={styles.stockTable}>
              <div className={styles.stockHeader}>
                <span>Service</span>
                <span>Tier</span>
                <span>Stock</span>
                <span>Status</span>
              </div>
              {services.map(s => (
                <div key={s.id} className={styles.stockRow}>
                  <div className={styles.stockService}>
                    <img src={s.iconUrl || s.image} alt={s.label} className={styles.stockIcon} />
                    <span>{s.label}</span>
                  </div>
                  <span className={`${styles.tierBadge} ${styles[`tier_${s.tier}`]}`}>{s.tier}</span>
                  <span className={styles.stockCount}>{s.stock.toLocaleString()}</span>
                  <span className={`${styles.stockStatus} ${s.stock > 0 ? styles.stockOnline : styles.stockOffline}`}>
                    {s.stock > 0 ? "En ligne" : "Rupture"}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── USERS ── */}
        {activeTab === "users" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className={styles.sectionHeader}>
              <h3>Top Utilisateurs (Leaderboard)</h3>
            </div>
            <div className={styles.stockTable}>
              <div className={styles.stockHeader}>
                <span>#</span>
                <span>Utilisateur</span>
                <span>Générations</span>
              </div>
              {users.map(u => (
                <div key={u.rank} className={styles.stockRow}>
                  <span className={styles.userRank}>#{u.rank}</span>
                  <div className={styles.stockService}>
                    <img src={u.avatar} alt={u.name} className={styles.stockIcon} style={{borderRadius:"50%"}} />
                    <span>{u.name}</span>
                    {u.tier && <span className={`${styles.tierBadge} ${styles[`tier_${u.tier.toLowerCase()}`]}`}>{u.tier}</span>}
                  </div>
                  <span className={styles.stockCount}>{u.score?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── CHAT MODERATION ── */}
        {activeTab === "chat" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className={styles.sectionHeader}>
              <h3>Derniers messages du Chat Général</h3>
              <button className={styles.refreshBtn} onClick={() => {
                fetch('/api-bot/chat/general').then(r => r.json()).then(d => { setChatMessages(d); showNotif("Chat actualisé !"); });
              }}>
                <RefreshCw size={16} /> Rafraîchir
              </button>
            </div>
            <div className={styles.chatModList}>
              {chatMessages.length === 0 && <p style={{color:"rgba(255,255,255,0.3)", textAlign:"center", padding:"2rem"}}>Aucun message</p>}
              {chatMessages.map(m => (
                <div key={m.id} className={styles.chatModItem}>
                  <img src={m.avatar} alt="" className={styles.chatModAvatar} />
                  <div className={styles.chatModInfo}>
                    <div className={styles.chatModAuthor}>
                      {m.username} {m.isAdmin && <Crown size={12} style={{color:"#ff4785"}} />}
                    </div>
                    <div className={styles.chatModText}>{m.content}</div>
                  </div>
                  <div className={styles.chatModTime}>
                    {new Date(m.timestamp).toLocaleTimeString("fr-FR", {hour:"2-digit", minute:"2-digit"})}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── CONFIG ── */}
        {activeTab === "config" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className={styles.configGrid}>
              <div className={styles.configCard}>
                <h3><Settings size={18} /> Informations du Serveur</h3>
                <div className={styles.configRow}>
                  <span>Guild ID</span><span className={styles.configValue}>1532343959722917979</span>
                </div>
                <div className={styles.configRow}>
                  <span>API URL</span><span className={styles.configValue}>api.primegen.eu</span>
                </div>
                <div className={styles.configRow}>
                  <span>Frontend</span><span className={styles.configValue}>primegen.eu (Vercel)</span>
                </div>
                <div className={styles.configRow}>
                  <span>Backend</span><span className={styles.configValue}>Coolify Docker</span>
                </div>
              </div>
              <div className={styles.configCard}>
                <h3><ShieldAlert size={18} /> Accès Staff (Tickets & Admin)</h3>
                <div className={styles.configRow}>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", margin: 0, paddingBottom: "10px" }}>
                    Ces utilisateurs auront le badge Admin dans le chat et l'accès au support.
                  </p>
                </div>
                <div className={styles.staffList}>
                  {staffIds.map(id => (
                    <div key={id} className={styles.staffItem}>
                      <span className={styles.staffId}>{id}</span>
                      {id !== "1178305844698435625" && (
                        <button className={styles.staffRemoveBtn} onClick={() => removeStaffId(id)}>
                          <Trash2 size={14} />
                        </button>
                      )}
                      {id === "1178305844698435625" && <span className={styles.superAdminBadge}>SuperAdmin</span>}
                    </div>
                  ))}
                </div>
                <div className={styles.addStaffForm}>
                  <input 
                    type="text" 
                    placeholder="Discord ID..." 
                    value={newStaffId} 
                    onChange={(e) => setNewStaffId(e.target.value)} 
                    className={styles.addStaffInput}
                  />
                  <button className={styles.addStaffBtn} onClick={addStaffId}><Plus size={16} /> Ajouter</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
