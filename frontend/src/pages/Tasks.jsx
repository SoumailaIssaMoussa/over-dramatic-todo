import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import TaskCard from "../components/TaskCard";
import AddTaskModal from "../components/AddTaskModal";
import StoryModal from "../components/StoryModal";
import { fetchTasks, fetchStats, createTask, updateTask, deleteTask, generateReaction } from "../services/api";
import { useTheme } from "../context/ThemeContext";
import "./Tasks.css";

const EMPTY_MESSAGES = {
  all:         { icon:"🎭", title:"The Stage is Empty",       sub:"No crises declared yet. Are you… actually fine?" },
  active:      { icon:"😌", title:"No Active Suffering",      sub:"Either you're on top of things, or in denial." },
  completed:   { icon:"🏆", title:"No Victories Yet",         sub:"The battle has not yet been won." },
  catastrophic:{ icon:"🕊️", title:"No Apocalypses Pending",  sub:"Enjoy this rare moment of relative sanity." },
  recurring:   { icon:"🔄", title:"No Recurring Torments",   sub:"Nothing is haunting you. Yet." },
  overdue:     { icon:"⏰", title:"Nothing Overdue!",         sub:"You are — impossibly — on schedule." },
};

const SORT_OPTIONS = [
  { value:"createdAt", label:"⏱️ Most Recent" },
  { value:"drama",     label:"💀 Most Dramatic" },
  { value:"dueDate",   label:"📅 By Deadline" },
  { value:"title",     label:"🔤 Alphabetical" },
  { value:"priority",  label:"🔥 By Priority" },
];

const MOOD_QUOTES = {
  calm:        "A moment of peace before the next catastrophe.",
  tense:       "The pressure is building… brace yourself.",
  dramatic:    "Every task is a battle. Every deadline, a war.",
  catastrophic:"THIS IS FINE. (It is not fine.)",
};

export default function Tasks() {
  const navigate = useNavigate();
  const { mood, updateMood } = useTheme();
  const [tasks, setTasks]       = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");
  const [sort, setSort]         = useState("createdAt");
  const [search, setSearch]     = useState("");
  const [showModal, setShowModal]   = useState(false);
  const [showStory, setShowStory]   = useState(false);
  const [toast, setToast]           = useState(null);

  const user  = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  useEffect(() => { if (!token) navigate("/login"); }, [token]);
  useEffect(() => { if (token) loadAll(); }, [token, filter, sort, search]);

  const loadAll = async () => {
    try {
      setLoading(true);
      const params = { sort };
      if (filter !== "all") params.filter = filter;
      if (search) params.search = search;
      const [taskData, statsData] = await Promise.all([fetchTasks(params), fetchStats()]);
      setTasks(taskData);
      setStats(statsData);
      // Sync mood from server
      if (statsData.dramaMood && statsData.dramaMood !== mood) updateMood(statsData.dramaMood);
    } catch (err) {
      showToast("Failed to load crises: " + err.message, "error");
    } finally { setLoading(false); }
  };

  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAdd = async (payload) => {
    const task = await createTask(payload);
    setTasks(prev => [task, ...prev]);
    loadAll();
    showToast("🎭 A new crisis has been declared!", "success");
  };

  const handleUpdate = async (id, payload, taskObj) => {
    const updated = await updateTask(id, payload);
    setTasks(prev => prev.map(t => t._id === id ? updated : t));
    if (payload.completed === true) {
      loadAll();
      // AI reaction
      try {
        const { reaction } = await generateReaction(taskObj?.title || updated.title, updated.dramaLevel);
        showToast(`🏆 ${reaction}`, "success");
      } catch {
        showToast("🏆 VICTORY! Another crisis survived!", "success");
      }
    } else if (payload.completed === false) {
      loadAll();
      showToast("🔄 Crisis reinstated. The suffering continues.", "warning");
    }
  };

  const handleDelete = async (id) => {
    await deleteTask(id);
    setTasks(prev => prev.filter(t => t._id !== id));
    loadAll();
    showToast("💥 The crisis has been OBLITERATED.", "warning");
  };

  const completionRate = stats
    ? stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
    : 0;

  const emptyState = EMPTY_MESSAGES[filter] || EMPTY_MESSAGES.all;

  return (
    <div className="tasks-layout">
      <Header user={user} onSearchChange={setSearch} />

      <div className="tasks-body">
        <Sidebar activeFilter={filter} onFilterChange={setFilter} stats={stats} />

        <main className="tasks-main">
          {/* Mood Quote Banner */}
          <div className="mood-quote-banner">
            <span className="mqb-text">"{MOOD_QUOTES[mood]}"</span>
            <span className="mqb-mood">— Current Mood: {stats?.dramaMood || mood}</span>
          </div>

          {/* Stats Banner */}
          {stats && (
            <div className="stats-banner">
              <div className="stat-tile">
                <span className="stat-num">{stats.total}</span>
                <span className="stat-lbl">Total Crises</span>
              </div>
              <div className="stat-tile stat-tile-green">
                <span className="stat-num">{stats.completed}</span>
                <span className="stat-lbl">Survived</span>
              </div>
              <div className="stat-tile stat-tile-amber">
                <span className="stat-num">{stats.active}</span>
                <span className="stat-lbl">Ongoing Suffering</span>
              </div>
              <div className="stat-tile stat-tile-red">
                <span className="stat-num">{stats.catastrophic}</span>
                <span className="stat-lbl">☠️ Catastrophic</span>
              </div>
              {stats.overdue > 0 && (
                <div className="stat-tile stat-tile-red">
                  <span className="stat-num">{stats.overdue}</span>
                  <span className="stat-lbl">⏰ Overdue</span>
                </div>
              )}
              <div className="stat-tile stat-completion">
                <div className="completion-ring" style={{ "--pct": completionRate }}>
                  <span className="completion-num">{completionRate}%</span>
                </div>
                <span className="stat-lbl">Survived Rate</span>
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="tasks-toolbar">
            <div className="toolbar-left">
              <h2 className="toolbar-title">
                {filter === "all"          && "🎭 All Crises"}
                {filter === "active"       && "🔥 Ongoing Suffering"}
                {filter === "completed"    && "🏆 Survived!"}
                {filter === "catastrophic" && "💀 CATASTROPHIC EVENTS"}
                {filter === "recurring"    && "🔄 Recurring Torments"}
                {filter === "overdue"      && "⏰ Past the Deadline"}
              </h2>
              <span className="task-count">{tasks.length} {tasks.length === 1 ? "crisis" : "crises"}</span>
            </div>
            <div className="toolbar-right">
              <select value={sort} onChange={e => setSort(e.target.value)} className="sort-select">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <button className="btn btn-ghost" onClick={() => setShowStory(true)} title="Generate AI dramatic summary">
                📖 My Chronicle
              </button>
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                ⚡ Declare Crisis
              </button>
            </div>
          </div>

          {/* Task List */}
          <div className="task-list-wrap">
            {loading ? (
              <div className="loading-state">
                <div className="drama-spinner">🎭</div>
                <p>Loading your suffering…</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">{emptyState.icon}</div>
                <h3 className="empty-title">{emptyState.title}</h3>
                <p className="empty-sub">{emptyState.sub}</p>
                {filter === "all" && (
                  <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    🎭 Declare Your First Crisis
                  </button>
                )}
              </div>
            ) : (
              <div className="task-list">
                {tasks.map(task => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {showModal && <AddTaskModal onClose={() => setShowModal(false)} onAdd={handleAdd} />}
      {showStory && <StoryModal onClose={() => setShowStory(false)} />}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
    </div>
  );
}
