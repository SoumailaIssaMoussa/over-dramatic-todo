import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Tasks.css";

function Tasks() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dramaLevel, setDramaLevel] = useState(2);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchTasks();
  }, [token, navigate]);

  const fetchTasks = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/tasks", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Erreur chargement tâches");
        return;
      }

      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Serveur inaccessible");
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("La tâche ne peut pas être vide");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          dramaLevel,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Erreur création tâche");
        return;
      }

      setTasks([data, ...tasks]);
      setTitle("");
      setDescription("");
      setDramaLevel(2);
      setError("");
    } catch {
      setError("Erreur serveur");
    }
  };

  const toggleComplete = async (task) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/tasks/${task._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            completed: !task.completed,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) return;

      setTasks(tasks.map((t) => (t._id === task._id ? data : t)));
    } catch {}
  };

  const updateDrama = async (taskId, level) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/tasks/${taskId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ dramaLevel: level }),
        }
      );

      const data = await res.json();
      setTasks(tasks.map((t) => (t._id === taskId ? data : t)));
    } catch {}
  };

  const updateTitle = async (taskId) => {
    if (!editTitle.trim()) {
      setEditingId(null);
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/tasks/${taskId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title: editTitle }),
        }
      );

      const data = await res.json();
      setTasks(tasks.map((t) => (t._id === taskId ? data : t)));
      setEditingId(null);
    } catch {}
  };

  const deleteTask = async (id) => {
    if (!confirm("Supprimer cette tâche ?")) return;

    try {
      await fetch(`http://localhost:5000/api/tasks/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTasks(tasks.filter((t) => t._id !== id));
    } catch {}
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // Filtrer les tâches
  const filteredTasks = tasks.filter((task) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "completed" && task.completed) ||
      (filter === "pending" && !task.completed);

    const matchesSearch = task.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;

  const getDramaEmoji = (level) => {
    switch (level) {
      case 1:
        return "😌";
      case 2:
        return "😬";
      case 3:
        return "🔥";
      default:
        return "😌";
    }
  };

  const getDramaLabel = (level) => {
    switch (level) {
      case 1:
        return "Low";
      case 2:
        return "Medium";
      case 3:
        return "High";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="tasks-container">
      {/* Header */}
      <div className="tasks-header">
        <div className="header-content">
          <div>
            <h1 className="tasks-title">🎭 Over-Dramatic To-Do</h1>
            <p className="welcome-message">Welcome, {user.name || "User"}!</p>
          </div>
          <button className="logout-btn" onClick={logout}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat">
          <span className="stat-label">Total</span>
          <span className="stat-value">{totalCount}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Completed</span>
          <span className="stat-value completed">{completedCount}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Pending</span>
          <span className="stat-value pending">{totalCount - completedCount}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Progress</span>
          <span className="stat-value">
            {totalCount > 0
              ? Math.round((completedCount / totalCount) * 100)
              : 0}
            %
          </span>
        </div>
      </div>

      {/* Add Task Form */}
      <div className="add-task-section">
        <h2>Create New Task</h2>
        <form onSubmit={addTask} className="add-task-form">
          <div className="form-group">
            <input
              type="text"
              placeholder="Task title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="form-group">
            <textarea
              placeholder="Add description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field textarea"
              rows="2"
            ></textarea>
          </div>

          <div className="form-row">
            <select
              value={dramaLevel}
              onChange={(e) => setDramaLevel(Number(e.target.value))}
              className="drama-select"
            >
              <option value={1}>😌 Low drama</option>
              <option value={2}>😬 Medium drama</option>
              <option value={3}>🔥 High drama</option>
            </select>

            <button type="submit" className="btn btn-primary">
              ➕ Add Task
            </button>
          </div>
        </form>
        {error && <p className="error-message">{error}</p>}
      </div>

      {/* Filter & Search */}
      <div className="controls-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={`filter-btn ${filter === "pending" ? "active" : ""}`}
            onClick={() => setFilter("pending")}
          >
            Pending
          </button>
          <button
            className={`filter-btn ${filter === "completed" ? "active" : ""}`}
            onClick={() => setFilter("completed")}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Tasks List */}
      <div className="tasks-list">
        {loading && <p className="loading-message">Loading tasks...</p>}

        {!loading && filteredTasks.length === 0 && (
          <p className="empty-state">
            {tasks.length === 0
              ? "No tasks yet. Create one to get started! 🎭"
              : "No tasks match your search."}
          </p>
        )}

        {filteredTasks.map((task) => (
          <div
            key={task._id}
            className={`task-card ${task.completed ? "completed" : ""}`}
          >
            <div className="task-checkbox">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleComplete(task)}
                className="checkbox-input"
              />
            </div>

            <div className="task-content">
              {editingId === task._id ? (
                <div className="edit-mode">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="edit-input"
                    autoFocus
                  />
                  <button
                    className="btn btn-small"
                    onClick={() => updateTitle(task._id)}
                  >
                    Save
                  </button>
                  <button
                    className="btn btn-small btn-secondary"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <p className="task-title">{task.title}</p>
                  {task.description && (
                    <p className="task-description">{task.description}</p>
                  )}
                </>
              )}
            </div>

            <div className="task-actions">
              <div className="drama-buttons">
                <button
                  className={`drama-btn ${task.dramaLevel === 1 ? "active" : ""}`}
                  onClick={() => updateDrama(task._id, 1)}
                  title="Low drama"
                >
                  😌
                </button>
                <button
                  className={`drama-btn ${task.dramaLevel === 2 ? "active" : ""}`}
                  onClick={() => updateDrama(task._id, 2)}
                  title="Medium drama"
                >
                  😬
                </button>
                <button
                  className={`drama-btn ${task.dramaLevel === 3 ? "active" : ""}`}
                  onClick={() => updateDrama(task._id, 3)}
                  title="High drama"
                >
                  🔥
                </button>
              </div>

              <div className="action-buttons">
                <button
                  className="btn btn-small btn-secondary"
                  onClick={() => {
                    setEditingId(task._id);
                    setEditTitle(task.title);
                  }}
                  title="Edit task"
                >
                  ✏️
                </button>
                <button
                  className="btn btn-small btn-danger"
                  onClick={() => deleteTask(task._id)}
                  title="Delete task"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="task-meta">
              <span className="drama-badge">
                {getDramaEmoji(task.dramaLevel)} {getDramaLabel(task.dramaLevel)}
              </span>
              {task.completed && <span className="completed-badge">✓ Done</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Tasks;
