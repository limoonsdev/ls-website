"use client";

import { secureFetch } from "@/lib/crypto";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
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

  // Shop
  const [shopItems, setShopItems] = useState([]);
  const [newShopItem, setNewShopItem] = useState({ id: "", name: "", price: "", features: "", style: "premium", badge: "" });

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Tickets
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [msgLoading, setMsgLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (status === "loading") return;
    if (session?.user?.id === ADMIN_ID) {
      setIsAuthorized(true);
      setCheckingAuth(false);
      return;
    }
    if (session?.user?.id) {
      secureFetch('/api-bot/admin/staff')
        .then(r => r.ok ? r.json() : [])
        .then(staff => {
          if (Array.isArray(staff) && staff.includes(session.user.id)) {
            setIsAuthorized(true);
          }
          setCheckingAuth(false);
        })
        .catch(() => setCheckingAuth(false));
    } else {
      setCheckingAuth(false);
    }
  }, [session, status]);

  const router = useRouter();

  useEffect(() => {
    Promise.all([
      secureFetch('/api-bot/services/stock').then(r => r.ok ? r.json() : []),
      secureFetch('/api-bot/leaderboard').then(r => r.ok ? r.json() : []),
      secureFetch('/api-bot/admin/staff').then(r => r.ok ? r.json() : []),
      secureFetch('/api-bot/admin/maintenance').then(r => r.ok ? r.json() : null),
      secureFetch('/api-bot/shop').then(r => r.ok ? r.json() : []),
      secureFetch('/api-bot/admin/tickets').then(r => r.ok ? r.json() : []),
    ]).then(([s, u, st, maint, shop, t]) => {
      setServices(Array.isArray(s) ? s : []);
      setUsers(Array.isArray(u) ? u : []);
      setStaffIds(Array.isArray(st) ? st : ["1178305844698435625"]);
      if (maint) {
        setMaintenance(maint.maintenance);
        setMaintenanceMsg(maint.message || "");
      }
      setShopItems(Array.isArray(shop) ? shop : []);
      setTickets(Array.isArray(t) ? t : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeTicket) return;
    const fetchMsgs = () => {
      secureFetch(`/api-bot/tickets/${activeTicket.userId}/${activeTicket.channelId}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) setMessages(data.reverse());
        });
    };
    fetchMsgs();
    const interval = setInterval(fetchMsgs, 5000);
    return () => clearInterval(interval);
  }, [activeTicket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleReply = async () => {
    if (!newMessage.trim() || !activeTicket) return;
    setMsgLoading(true);
    try {
      const res = await secureFetch(`/api-bot/tickets/${activeTicket.channelId}/reply`, 'POST', { 
        message: newMessage, 
        username: session?.user?.name || "Staff", 
        isAdmin: true 
      });
      if (res.ok) {
        setNewMessage("");
        showNotif("Réponse envoyée");
      }
    } catch (e) {
      showNotif("Erreur", "error");
    }
    setMsgLoading(false);
  };

  const handleCloseTicket = async () => {
    if (!activeTicket) return;
    if (!confirm("Fermer ce ticket ?")) return;
    try {
      const res = await secureFetch(`/api-bot/tickets/${activeTicket.channelId}/close`, 'POST');
      if (res.ok) {
        showNotif("Ticket fermé");
        setTickets(tickets.map(t => t.id === activeTicket.id ? { ...t, status: "closed" } : t));
        setActiveTicket(null);
      }
    } catch(e) {}
  };

  if (status === "loading" || checkingAuth) return null;
  if (!isAuthorized) {
    if (typeof window !== "undefined") {
      router.push("/dashboard/generators");
    }
    return null;
  }

  const showNotif = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const refreshServices = () => {
    secureFetch('/api-bot/services/stock')
      .then(r => r.ok ? r.json() : [])
      .then(d => {
        setServices(Array.isArray(d) ? d : []);
        showNotif("Stocks actualisés !");
      });
  };

  // Save Shop
  const saveShopItems = async (newItems) => {
    try {
      const res = await secureFetch('/api-bot/admin/shop', 'POST', { shopItems: newItems });
      if (res.ok) {
        setShopItems(newItems);
        showNotif("Boutique mise à jour !");
      }
    } catch(e) {
      showNotif("Erreur de sauvegarde de la boutique", "error");
    }
  };

  const addShopItem = () => {
    if (!newShopItem.name || !newShopItem.price) return;
    const item = { ...newShopItem, id: newShopItem.name.toLowerCase().replace(/\s+/g, '_'), features: newShopItem.features.split('\n').filter(f => f.trim()) };
    saveShopItems([...shopItems, item]);
    setNewShopItem({ id: "", name: "", price: "", features: "", style: "premium", badge: "" });
  };

  const removeShopItem = (id) => {
    saveShopItems(shopItems.filter(s => s.id !== id));
  };

  // Staff CRUD
  const saveStaffIds = async (newIds) => {
    try {
      const res = await secureFetch('/api-bot/admin/staff', 'POST', { staffIds: newIds });
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
      const res = await secureFetch('/api-bot/admin/maintenance', 'POST', { maintenance: newState, message: newMsg });
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
      const res = await secureFetch('/api-bot/admin/restock', 'POST', { serviceId: restockService, combos: restockCombos });
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
      const res = await secureFetch('/api-bot/admin/clear-stock', 'POST', { serviceId });
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
    { id: "tickets", label: "Tickets", icon: MessageSquare },
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
                <div className={styles.statIcon} style={{background:"rgba(255,23,68,0.1)", color:"#ff1744"}}><Database size={24} /></div>
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
                    <div className={styles.popularLeft}>
                      <img src={s.iconUrl || s.image || "https://ui-avatars.com/api/?name=" + s.label + "&background=random"} alt={s.label} className={styles.popularIcon} />
                      <span className={styles.popularName}>{s.label}</span>
                    </div>
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
                <div style={{marginTop: "10px"}}>
                  <label className={styles.addStaffBtn} style={{display: "inline-flex", cursor: "pointer", width: "auto", padding: "8px 16px"}}>
                    <Upload size={14} style={{marginRight: "8px"}}/> Upload Combo File (.txt)
                    <input 
                      type="file" 
                      accept=".txt" 
                      style={{display: "none"}}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            setRestockCombos(prev => (prev ? prev + "\n" + evt.target.result : evt.target.result));
                          };
                          reader.readAsText(file);
                        }
                      }}
                    />
                  </label>
                </div>
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
              <button className={styles.stockClearBtn} onClick={async () => {
                if(confirm("⚠️ Confirmer le reset total du classement ?")) {
                  await secureFetch('/api-bot/admin/reset-leaderboard', 'POST');
                  showNotif("Classement réinitialisé !");
                  setUsers([]);
                }
              }} style={{marginLeft: "10px", width: "auto", padding: "8px 16px"}}>
                <Trash2 size={16} style={{marginRight:"8px"}}/> Reset Classement
              </button>
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
                  <span className={styles.stockCount}>{u.total_combos_generated?.toLocaleString()}</span>
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
                <h3><AlertTriangle size={18} style={{ color: "#ff1744" }} /> Mode Maintenance Globale</h3>
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
                      background: maintenance ? "#ff1744" : "rgba(255,255,255,0.1)",
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
              {/* Shop Management */}
              <div className={styles.configCard}>
                <h3><Package size={18} /> Gestion de la Boutique</h3>
                <div className={styles.configRow}>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", margin: 0, paddingBottom: "10px" }}>
                    Ajoute, modifie ou supprime des articles (Premium, Nitro, Serveur Boost...).
                  </p>
                </div>
                <div className={styles.staffList}>
                  {shopItems.map(item => (
                    <div key={item.id} className={styles.staffItem}>
                      <div>
                        <span className={styles.staffId}>{item.name}</span>
                        <span style={{color:"#ffffff", marginLeft:"10px", fontSize:"0.8rem"}}>{item.price}€</span>
                      </div>
                      <button className={styles.staffRemoveBtn} onClick={() => removeShopItem(item.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex", flexDirection:"column", gap:"8px", marginTop:"10px"}}>
                  <input type="text" placeholder="Nom (ex: Nitro Boost)" value={newShopItem.name} onChange={e => setNewShopItem({...newShopItem, name: e.target.value})} className={styles.addStaffInput} />
                  <input type="text" placeholder="Prix (ex: 3.50)" value={newShopItem.price} onChange={e => setNewShopItem({...newShopItem, price: e.target.value})} className={styles.addStaffInput} />
                  <select value={newShopItem.style} onChange={e => setNewShopItem({...newShopItem, style: e.target.value})} className={styles.addStaffInput}>
                    <option value="premium">Style Premium (Rose)</option>
                    <option value="prime">Style Prime (Bleu)</option>
                  </select>
                  <input type="text" placeholder="Badge (ex: Best Seller) - Optionnel" value={newShopItem.badge} onChange={e => setNewShopItem({...newShopItem, badge: e.target.value})} className={styles.addStaffInput} />
                  <textarea placeholder="Caractéristiques (1 par ligne)" value={newShopItem.features} onChange={e => setNewShopItem({...newShopItem, features: e.target.value})} className={styles.addStaffInput} rows={3} />
                  <button className={styles.addStaffBtn} onClick={addShopItem} style={{justifyContent:"center"}}><Plus size={16} /> Ajouter l'article</button>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* ── TICKETS ── */}
        {activeTab === "tickets" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.ticketsGrid}>
            <div className={styles.ticketList}>
              <h3 style={{ padding: '16px', margin: 0, borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'white' }}>Tickets ({tickets.length})</h3>
              <div style={{ flex: 1, overflowY: 'auto', padding: '10px', minHeight: 0 }}>
                {tickets.map(t => (
                  <div 
                    key={t.id} 
                    onClick={() => setActiveTicket(t)}
                    style={{
                      padding: '12px', marginBottom: '8px', borderRadius: '10px', cursor: 'pointer',
                      background: activeTicket?.id === t.id ? 'rgba(255,23,68,0.1)' : 'rgba(255,255,255,0.02)',
                      border: activeTicket?.id === t.id ? '1px solid rgba(255,23,68,0.2)' : '1px solid transparent'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ color: 'white', fontWeight: 600 }}>{t.subject}</span>
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: t.status === 'open' ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.1)', color: t.status === 'open' ? '#00ff88' : '#aaa' }}>
                        {t.status === 'open' ? 'Ouvert' : 'Fermé'}
                      </span>
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>User: {t.userId}</span>
                      <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.ticketChat}>
              {activeTicket ? (
                <>
                  <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ color: 'white', margin: '0 0 4px 0' }}>{activeTicket.subject}</h3>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>Catégorie : {activeTicket.category}</span>
                    </div>
                    {activeTicket.status === 'open' && (
                      <button 
                        onClick={handleCloseTicket}
                        style={{ padding: '8px 16px', background: 'rgba(255,23,68,0.1)', color: '#ff1744', border: '1px solid rgba(255,23,68,0.2)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Fermer le ticket
                      </button>
                    )}
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0 }}>
                    {messages.map((m, i) => {
                      const isMe = m.authorId === session?.user?.id || m.authorName === 'PrimeGen Staff';
                      return (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginBottom: '4px' }}>
                            {m.authorName} • {new Date(m.timestamp).toLocaleTimeString()}
                          </span>
                          <div style={{
                            background: isMe ? 'rgba(255,23,68,0.15)' : 'rgba(255,255,255,0.05)',
                            color: 'white', padding: '10px 16px', borderRadius: '12px', maxWidth: '80%',
                            border: isMe ? '1px solid rgba(255,23,68,0.3)' : '1px solid rgba(255,255,255,0.1)'
                          }}>
                            {m.content}
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                  {activeTicket.status === 'open' ? (
                    <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '10px' }}>
                      <input 
                        type="text" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                        placeholder="Répondre au ticket en tant que Staff..."
                        style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '12px 16px', borderRadius: '10px' }}
                      />
                      <button 
                        onClick={handleReply}
                        disabled={msgLoading || !newMessage.trim()}
                        style={{ background: '#ff1744', color: 'white', border: 'none', padding: '0 20px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', opacity: (msgLoading || !newMessage.trim()) ? 0.5 : 1 }}
                      >
                        Envoyer
                      </button>
                    </div>
                  ) : (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Ce ticket est fermé.</div>
                  )}
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>
                  Sélectionnez un ticket pour voir la conversation
                </div>
              )}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}


