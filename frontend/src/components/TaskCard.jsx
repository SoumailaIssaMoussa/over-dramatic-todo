import { useState } from "react";
import "./TaskCard.css";

const DRAMA_LABEL = (lvl) => {
  if (lvl <= 2) return { text: "Mildly Inconvenient", color: "#10b981", bg: "rgba(16,185,129,0.1)" };
  if (lvl <= 4) return { text: "Somewhat Annoying", color: "#3b82f6", bg: "rgba(59,130,246,0.1)" };
  if (lvl <= 6) return { text: "Emotionally Devastating", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" };
  if (lvl <= 8) return { text: "EXISTENTIAL CRISIS", color: "#ef4444", bg: "rgba(239,68,68,0.1)" };
  return { text: "☠️ END OF THE WORLD", color: "#a855f7", bg: "rgba(168,85,247,0.1)" };
};

const COMPLETE_REACTIONS = [
  "IMPOSSIBLE! You actually did it?!",
  "The universe is SHOCKED.",
  "History will remember this moment.",
  "Shakespeare is weeping tears of joy.",
  "Against ALL odds... you survived.",
  "The gods of productivity bow before you.",
];

const DELETE_REASONS = [
  "Dramatically cast into the void.",
  "Banished from existence forever.",
  "The task has accepted its fate.",
  "Erased from the annals of suffering.",
];

export default function TaskCard({ task, onUpdate, onDelete }) {
  const [flashing, setFlashing] = useState(false);
  const [reaction, setReaction] = useState("");
  const [showReaction, setShowReaction] = useState(false);

  const drama = DRAMA_LABEL(task.dramaLevel);

  const handleToggle = async () => {
    if (!task.completed) {
      const msg = COMPLETE_REACTIONS[Math.floor(Math.random() * COMPLETE_REACTIONS.length)];
      setReaction(msg);
      setFlashing(true);
      setShowReaction(true);
      setTimeout(() => {
        setFlashing(false);
        setShowReaction(false);
      }, 2500);
    }
    await onUpdate(task._id, { completed: !task.completed });
  };

  const handleDelete = async () => {
    const reason = DELETE_REASONS[Math.floor(Math.random() * DELETE_REASONS.length)];
    if (!window.confirm(`⚠️ Are you sure?\n\n"${reason}"`)) return;
    await onDelete(task._id);
  };

  const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date();

  return (
    <div className={`task-card ${task.completed ? "task-done" : ""} ${flashing ? "task-flash" : ""} ${task.dramaLevel >= 9 ? "task-apocalypse" : ""}`}>
      {showReaction && (
        <div className="task-reaction">
          🎉 {reaction}
        </div>
      )}

      <div className="task-card-main">
        <button
          className={`task-check ${task.completed ? "checked" : ""}`}
          onClick={handleToggle}
          title={task.completed ? "Un-complete (retreat from victory)" : "Complete (conquer this crisis)"}
        >
          {task.completed ? "✓" : ""}
        </button>

        <div className="task-body">
          <span className={`task-title ${task.completed ? "task-title-done" : ""}`}>
            {task.title}
          </span>
          {task.description && (
            <span className="task-desc">{task.description}</span>
          )}
          <div className="task-meta">
            {task.category && (
              <span className="task-cat" style={{ color: task.category.color, borderColor: task.category.color + "44" }}>
                {task.category.icon} {task.category.name}
              </span>
            )}
            {task.dueDate && (
              <span className={`task-due ${isOverdue ? "overdue" : ""}`}>
                {isOverdue ? "💀 OVERDUE:" : "📅"} {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
            {task.attachment?.originalName && (
              <span className="task-attach">📎 {task.attachment.originalName}</span>
            )}
          </div>
        </div>
      </div>

      <div className="task-card-right">
        <span
          className="task-drama-badge"
          style={{ color: drama.color, background: drama.bg, borderColor: drama.color + "44" }}
        >
          {task.dramaLevel}/10 — {drama.text}
        </span>
        <button className="task-delete-btn" onClick={handleDelete} title="Obliterate">
          🗑️
        </button>
      </div>
    </div>
  );
}
