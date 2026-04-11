import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { fetchNotifications, markAllRead, clearNotifications } from "../services/api";
import "./Header.css";

export default function Header({ user, onSearchChange }) {
  const [showNotif, setShowNotif] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [search, setSearch] = useState("");
  const notifRef = useRef(null);
  const userRef = useRef(null);
  const navigate = useNavigate();

  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (userRef.current && !userRef.current.contains(e.target)) setShowUser(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch {}
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    setNotifications((n) => n.map((x) => ({ ...x, read: true })));
  };

  const handleClear = async () => {
    await clearNotifications();
    setNotifications([]);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    onSearchChange(e.target.value);
  };

  const notifIcon = { info: "📜", success: "✅", warning: "⚠️", catastrophe: "💀" };
  const notifColor = { info: "#3b82f6", success: "#10b981", warning: "#f59e0b", catastrophe: "#ef4444" };

  return (
    <header className="header">
      <div className="header-brand">
        <span className="header-mask">🎭</span>
        <div>
          <span className="header-title">Over-Dramatic To-Do</span>
          <span className="header-sub">Where Tasks Go to Suffer</span>
        </div>
      </div>

      <div className="header-search">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search your suffering..."
          value={search}
          onChange={handleSearch}
        />
      </div>

      <div className="header-actions">
        {/* Notifications */}
        <div className="header-icon-wrap" ref={notifRef}>
          <button
            className={`header-icon-btn ${unread > 0 ? "has-badge" : ""}`}
            onClick={() => { setShowNotif(!showNotif); setShowUser(false); }}
            title="Dramatic Alerts"
          >
            🔔
            {unread > 0 && <span className="badge">{unread}</span>}
          </button>

          {showNotif && (
            <div className="dropdown notif-dropdown">
              <div className="dropdown-head">
                <span>📜 Dramatic Alerts</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="dd-link" onClick={handleMarkAllRead}>Read all</button>
                  <button className="dd-link dd-link-red" onClick={handleClear}>Clear</button>
                </div>
              </div>
              <div className="notif-list">
                {notifications.length === 0 ? (
                  <p className="notif-empty">Blissful silence... for now.</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n._id} className={`notif-item ${!n.read ? "unread" : ""}`}>
                      <span className="notif-type-icon" style={{ color: notifColor[n.type] }}>
                        {notifIcon[n.type] || "📜"}
                      </span>
                      <div className="notif-body">
                        <p className="notif-msg">{n.message}</p>
                        <span className="notif-time">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="header-icon-wrap" ref={userRef}>
          <button
            className="user-pill"
            onClick={() => { setShowUser(!showUser); setShowNotif(false); }}
          >
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase() || "?"}
            </div>
            <span className="user-name-label">{user?.name?.split(" ")[0] || "Hero"}</span>
            <span style={{ fontSize: "0.6rem", color: "var(--text-dim)" }}>▼</span>
          </button>

          {showUser && (
            <div className="dropdown user-dropdown">
              <div className="dropdown-head">
                <div className="user-avatar user-avatar-lg">
                  {user?.name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div>
                  <p className="dd-name">{user?.name}</p>
                  <p className="dd-email">{user?.email}</p>
                </div>
              </div>
              <div className="dd-divider" />
              <button className="dd-item" onClick={handleLogout}>
                <span>🚪</span> Exit the Drama
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
