"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Database, Users, ShieldAlert, Settings, Package, Upload,
  Plus, Trash2, Search, RefreshCw, BarChart3, 
  MessageSquare, Crown, AlertTriangle, CheckCircle, X
} from "lucide-react";
import styles from "./admin.module.css";

const ADMIN_ID = "1178305844698435625";

export default function AdminPanel() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState("overview");
  const [services, setServices] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Staff
  const [staffIds, setStaffIds] = useState([]);
  const [newStaffId, setNewStaffId] = useState("");

  // Maintenance
  const [maintenance, setMaintenance] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState("");

  // Restock
  const [restockService, setRestockService] = useState("");
  const [restockCombos, setRestockCombos] = useState("");
  const [restockLoading, setRestockLoading] = useState(false);

  if (status === "loading") return null;
  if (session?.user?.id !== ADMIN_ID) {
    redirect("/dashboard/generators");
  }

  const showNotif = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const refreshServices = () => {
    fetch('/api-bot/services/stock')
      .then(r => r.ok ? r.json() : [])
      .then(d => {
        setServices(Array.isArray(d) ? d : []);
        showNotif("Stocks actualisés !");
      });
  };

  useEffect(() => {
    Promise.all([
      fetch('/api-bot/services/stock').then(r => r.ok ? r.json() : []),
      fetch('/api-bot/leaderboard').then(r => r.ok ? r.json() : []),
      fetch('/api-bot/admin/staff').then(r => r.ok ? r.json() : []),
      fetch('/api-bot/admin/maintenance').then(r => r.ok ? r.json() : null),
    ]).then(([s, u, st, maint]) => {
      setServices(Array.isArray(s) ? s : []);
      setUsers(Array.isArray(u) ? u : []);
      setStaffIds(Array.isArray(st) ? st : ["1178305844698435625"]);
      if (maint) {
        setMaintenance(maint.maintenance);
        setMaintenanceMsg(maint.message || "");
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Staff CRUD
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
    if (id === ADMIN_ID) return;
    saveStaffIds(staffIds.filter(sId => sId !== id));
  };

  // Maintenance
  const saveMaintenance = async (newState, newMsg) => {
    try {
      const res = await fetch('/api-bot/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maintenance: newState, message: newMsg })
      });
      if (res.ok) {
        showNotif(newState ? "🔴 Maintenance ACTIVÉE" : "🟢 Maintenance DÉSACTIVÉE");
      }
    } catch(e) {
      showNotif("Erreur", "error");
    }
  };

  // Restock
  const handleRestock = async () => {
    if (!restockService || !restockCombos.trim()) {
      showNotif("Choisis un service et colle des combos", "error");
      return;
    }
    setRestockLoading(true);
    try {
      const res = await fetch('/api-bot/admin/restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId: restockService, combos: restockCombos })
      });
      const data = await res.json();
      if (data.success) {
        showNotif(`✅ ${data.added} comptes ajoutés à ${restockService} (${data.skipped} doublons ignorés)`);
        setRestockCombos("");
        refreshServices();
      } else {
        showNotif(data.error || "Erreur", "error");
      }
    } catch(e) {
      showNotif("Erreur de connexion", "error");
    }
    setRestockLoading(false);
  };

  // Clear stock
  const handleClearStock = async (serviceId, label) => {
    if (!confirm(`⚠️ Supprimer TOUS les comptes de ${label} ?`)) return;
    try {
      const res = await fetch('/api-bot/admin/clear-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId })
      });
      const data = await res.json();
      if (data.success) {
        showNotif(`🗑️ ${data.deleted} comptes supprimés de ${label}`);
        refreshServices();
      }
    } catch(e) {
      showNotif("Erreur", "error");
    }
  };

  const totalStock = services.reduce((acc, s) => acc + (s.stock || 0), 0);
  const activeServices = services.filter(s => s.stock > 0).length;

  const tabs = [
    { id: "overview", label: "Vue d'ensemble", icon: BarChart3 },
    { id: "stocks", label: "Stocks & Restock", icon: Database },
    { id: "users", label: "Utilisateurs", icon: Users },
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
                <div className={styles.statIcon} style={{background: maintenance ? "rgba(255,71,71,0.15)" : "rgba(0,255,136,0.1)", color: maintenance ? "#ff4747" : "#00ff88"}}>
                  <AlertTriangle size={24} />
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>{maintenance ? "ON" : "OFF"}</span>
                  <span className={styles.statLabel}>Maintenance</span>
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

        {/* ── STOCKS & RESTOCK ── */}
        {activeTab === "stocks" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Restock Zone */}
            <div className={styles.restockZone}>
              <h3><Upload size={18} /> Restock un Service</h3>
              <p style={{color:"rgba(255,255,255,0.4)", fontSize:"0.85rem", margin:"0 0 1rem"}}>
                Sélectionne un service, colle tes combos (un par ligne : email:password) et envoie.
              </p>
              <div className={styles.restockForm}>
                <select 
                  value={restockService} 
                  onChange={(e) => setRestockService(e.target.value)}
                  className={styles.restockSelect}
                >
                  <option value="">-- Choisis un service --</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.label} ({s.stock} en stock)</option>
                  ))}
                </select>
                <textarea 
                  value={restockCombos}
                  onChange={(e) => setRestockCombos(e.target.value)}
                  placeholder={"email1@gmail.com:password1\nemail2@gmail.com:password2\nemail3@gmail.com:password3\n..."}
                  className={styles.restockTextarea}
                  rows={8}
                />
                <div className={styles.restockActions}>
                  <span className={styles.restockCount}>
                    {restockCombos.split('\n').filter(l => l.trim()).length} comptes détectés
                  </span>
                  <button 
                    className={styles.restockBtn}
                    onClick={handleRestock}
                    disabled={restockLoading || !restockService || !restockCombos.trim()}
                  >
                    {restockLoading ? (
                      <><RefreshCw size={16} className={styles.spinning} /> Envoi...</>
                    ) : (
                      <><Upload size={16} /> Ajouter au stock</>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Stock Table */}
            <div className={styles.sectionHeader}>
              <h3>Tous les services ({services.length})</h3>
              <button className={styles.refreshBtn} onClick={refreshServices}>
                <RefreshCw size={16} /> Actualiser
              </button>
            </div>
            <div className={styles.stockTable}>
              <div className={styles.stockHeader}>
                <span>Service</span>
                <span>Tier</span>
                <span>Stock</span>
                <span>Status</span>
                <span>Actions</span>
              </div>
              {services.map(s => (
                <div key={s.id} className={styles.stockRow}>
                  <div className={styles.stockService}>
                    <img src={s.iconUrl || s.image} alt={s.label} className={styles.stockIcon} />
                    <span>{s.label}</span>
                  </div>
                  <span className={`${styles.tierBadge} ${styles[`tier_${s.tier}`]}`}>{s.tier}</span>
                  <span className={styles.stockCount}>{(s.stock || 0).toLocaleString()}</span>
                  <span className={`${styles.stockStatus} ${s.stock > 0 ? styles.stockOnline : styles.stockOffline}`}>
                    {s.stock > 0 ? "En ligne" : "Rupture"}
                  </span>
                  <div className={styles.stockActions}>
                    <button 
                      className={styles.stockQuickRestock}
                      onClick={() => { setRestockService(s.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      title="Restock ce service"
                    >
                      <Plus size={14} />
                    </button>
                    <button 
                      className={styles.stockClearBtn}
                      onClick={() => handleClearStock(s.id, s.label)}
                      title="Vider le stock"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
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
              {users.map((u, i) => (
                <div key={u.userId || i} className={styles.stockRow}>
                  <span className={styles.userRank}>#{i + 1}</span>
                  <div className={styles.stockService}>
                    <img src={u.avatar} alt={u.username} className={styles.stockIcon} style={{borderRadius:"50%"}} />
                    <span>{u.username}</span>
                  </div>
                  <span className={styles.stockCount}>{u.generations?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── CONFIG ── */}
        {activeTab === "config" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className={styles.configGrid}>
              {/* Server Info */}
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

              {/* Maintenance */}
              <div className={styles.configCard}>
                <h3><AlertTriangle size={18} style={{ color: "#ff4785" }} /> Mode Maintenance Globale</h3>
                <div className={styles.configRow}>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", margin: 0, paddingBottom: "10px" }}>
                    Bloque l'accès à tout le site (sauf pour toi).
                  </p>
                </div>
                <div className={styles.configRow} style={{ alignItems: "center" }}>
                  <span>Activer la maintenance</span>
                  <button 
                    onClick={() => {
                      const newState = !maintenance;
                      setMaintenance(newState);
                      saveMaintenance(newState, maintenanceMsg);
                    }}
                    style={{
                      padding: "8px 20px", borderRadius: "20px", border: "none", 
                      background: maintenance ? "#ff4785" : "rgba(255,255,255,0.1)",
                      color: "white", fontWeight: "bold", cursor: "pointer", transition: "0.3s",
                      fontSize: "0.9rem"
                    }}
                  >
                    {maintenance ? "🔴 ON" : "⚪ OFF"}
                  </button>
                </div>
                <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <textarea 
                    value={maintenanceMsg}
                    onChange={(e) => setMaintenanceMsg(e.target.value)}
                    placeholder="Message de maintenance..."
                    className={styles.addStaffInput}
                    style={{ minHeight: "80px", resize: "vertical", width: "100%" }}
                  />
                  <button 
                    className={styles.addStaffBtn} 
                    onClick={() => saveMaintenance(maintenance, maintenanceMsg)}
                    style={{ justifyContent: "center" }}
                  >
                    <RefreshCw size={16} /> Mettre à jour le message
                  </button>
                </div>
              </div>

              {/* Staff */}
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
                      {id !== ADMIN_ID && (
                        <button className={styles.staffRemoveBtn} onClick={() => removeStaffId(id)}>
                          <Trash2 size={14} />
                        </button>
                      )}
                      {id === ADMIN_ID && <span className={styles.superAdminBadge}>SuperAdmin</span>}
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
