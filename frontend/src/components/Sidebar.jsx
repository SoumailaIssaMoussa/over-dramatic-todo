import { Link } from "react-router-dom";
import "./Sidebar.css";

const FILTERS = [
  { id:"all",        label:"All Crises",      icon:"🎭", desc:"Every last one" },
  { id:"active",     label:"Ongoing Suffering",icon:"🔥", desc:"Not yet survived" },
  { id:"completed",  label:"Survived!",        icon:"🏆", desc:"Against all odds" },
  { id:"catastrophic",label:"CATASTROPHIC",   icon:"💀", desc:"Drama level 8–10" },
  { id:"recurring",  label:"Recurring Chaos", icon:"🔄", desc:"They always come back" },
  { id:"overdue",    label:"Past Deadline",   icon:"⏰", desc:"Time has run out" },
];

const DRAMA_LEVELS = [
  { range:"1–2", label:"Mildly Inconvenient",   color:"#10b981", emoji:"😐" },
  { range:"3–4", label:"Somewhat Annoying",      color:"#3b82f6", emoji:"😤" },
  { range:"5–6", label:"Emotionally Devastating",color:"#f59e0b", emoji:"😭" },
  { range:"7–8", label:"Existential Crisis",     color:"#ef4444", emoji:"😱" },
  { range:"9–10",label:"End of the World",       color:"#a855f7", emoji:"💀" },
];

export default function Sidebar({ activeFilter, onFilterChange, stats }) {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <p className="sidebar-section-label">Filter by Fate</p>
        {FILTERS.map(f => (
          <button key={f.id} className={`sidebar-item ${activeFilter===f.id?"active":""}`} onClick={()=>onFilterChange(f.id)}>
            <span className="sidebar-item-icon">{f.icon}</span>
            <div className="sidebar-item-text">
              <span className="sidebar-item-label">{f.label}</span>
              <span className="sidebar-item-desc">{f.desc}</span>
            </div>
            {f.id==="all"         && stats && <span className="sidebar-count">{stats.total}</span>}
            {f.id==="active"      && stats && <span className="sidebar-count">{stats.active}</span>}
            {f.id==="completed"   && stats && <span className="sidebar-count sidebar-count-green">{stats.completed}</span>}
            {f.id==="catastrophic"&& stats && <span className="sidebar-count sidebar-count-red">{stats.catastrophic}</span>}
            {f.id==="recurring"   && stats && <span className="sidebar-count">{stats.recurring||0}</span>}
            {f.id==="overdue"     && stats && <span className="sidebar-count sidebar-count-red">{stats.overdue||0}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-divider" />

      <div className="sidebar-nav">
        <p className="sidebar-section-label">Navigate</p>
        <Link to="/calendar" className="sidebar-item sidebar-link">
          <span className="sidebar-item-icon">📅</span>
          <div className="sidebar-item-text">
            <span className="sidebar-item-label">Calendar View</span>
            <span className="sidebar-item-desc">Catastrophes by date</span>
          </div>
        </Link>
        <Link to="/profile" className="sidebar-item sidebar-link">
          <span className="sidebar-item-icon">👤</span>
          <div className="sidebar-item-text">
            <span className="sidebar-item-label">My Profile</span>
            <span className="sidebar-item-desc">Badges & analytics</span>
          </div>
        </Link>
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-legend">
        <p className="sidebar-section-label">Drama Scale</p>
        {DRAMA_LEVELS.map(d => (
          <div key={d.range} className="legend-item">
            <span className="legend-emoji">{d.emoji}</span>
            <div>
              <span className="legend-range" style={{color:d.color}}>{d.range}</span>
              <span className="legend-label"> — {d.label}</span>
            </div>
          </div>
        ))}
      </div>

      {stats && (
        <div className="sidebar-mood">
          <p className="sidebar-section-label">Current Drama Level</p>
          <div className="mood-meter">
            <div className="mood-fill" style={{width:`${(stats.avgDrama/10)*100}%`}} />
          </div>
          <p className="mood-label">Average: {stats.avgDrama} / 10</p>
          {stats.badges?.length > 0 && (
            <p className="sidebar-badges">{stats.badges.map(b => ({first_crisis:"🎭",first_survivor:"🏆",drama_veteran:"⚔️",chaos_magnet:"🌪️",crisis_collector:"💼",agent_of_chaos:"😈"})[b]||"🎖️").join(" ")}</p>
          )}
        </div>
      )}
    </aside>
  );
}
