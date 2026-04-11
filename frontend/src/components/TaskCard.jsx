import { useState, useEffect } from "react";
import { fetchFileObjectUrl } from "../services/api";
import "./TaskCard.css";

const DRAMA_LABEL = (lvl) => {
  if (lvl <= 2) return { text:"Mildly Inconvenient",    color:"#10b981", bg:"rgba(16,185,129,0.1)" };
  if (lvl <= 4) return { text:"Somewhat Annoying",      color:"#3b82f6", bg:"rgba(59,130,246,0.1)" };
  if (lvl <= 6) return { text:"Emotionally Devastating",color:"#f59e0b", bg:"rgba(245,158,11,0.1)" };
  if (lvl <= 8) return { text:"EXISTENTIAL CRISIS",     color:"#ef4444", bg:"rgba(239,68,68,0.1)" };
  return              { text:"☠️ END OF THE WORLD",      color:"#a855f7", bg:"rgba(168,85,247,0.1)" };
};
const PRIORITY_ICONS = { low:"🟢", medium:"🔵", high:"🟠", apocalyptic:"💀" };

function AttachmentLink({ attachment }) {
  const [objUrl, setObjUrl] = useState(null);
  const [err, setErr]       = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch an authenticated blob URL when the attachment filename is known
  useEffect(() => {
    if (!attachment?.filename) return;
    let cancelled = false;
    setLoading(true);
    fetchFileObjectUrl(attachment.filename)
      .then(url => { if (!cancelled) setObjUrl(url); })
      .catch(() => { if (!cancelled) setErr(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => {
      cancelled = true;
      if (objUrl) URL.revokeObjectURL(objUrl);
    };
  }, [attachment?.filename]);

  const icon = attachment.mimetype?.includes("image") ? "🖼️"
             : attachment.mimetype?.includes("pdf")   ? "📄" : "📎";
  const sizeKb = attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : "";

  if (err)     return <span className="task-attach task-attach-err" title="File unavailable">⚠️ {attachment.originalName} (unavailable)</span>;
  if (loading) return <span className="task-attach">⏳ Loading attachment…</span>;

  return (
    <a href={objUrl || "#"} target="_blank" rel="noreferrer"
       download={attachment.originalName}
       className="task-attach task-attach-link"
       title={`Download ${attachment.originalName} · ${sizeKb}`}
    >
      {icon} {attachment.originalName}
      {sizeKb && <span className="attach-size"> · {sizeKb}</span>}
      <span className="attach-dl"> ↓</span>
    </a>
  );
}

export default function TaskCard({ task, onUpdate, onDelete }) {
  const [flashing, setFlashing]       = useState(false);
  const [reaction, setReaction]       = useState("");
  const [showReaction, setShowReaction] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const drama = DRAMA_LABEL(task.dramaLevel);

  const handleToggle = async () => {
    if (!task.completed) {
      setFlashing(true); setShowReaction(true);
      setReaction("⚡ Marking as survived…");
    }
    await onUpdate(task._id, { completed: !task.completed }, task);
    if (!task.completed) setTimeout(() => { setFlashing(false); setShowReaction(false); }, 3500);
  };

  const handleDelete = async () => {
    const reasons = [
      "Dramatically cast into the void.",
      "Banished from existence forever.",
      "Erased from the annals of suffering.",
      "The task has accepted its fate.",
    ];
    if (!window.confirm(`⚠️ Are you sure?\n\n"${reasons[Math.floor(Math.random()*reasons.length)]}"`)) return;
    await onDelete(task._id);
  };

  const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date();

  return (
    <div className={`task-card ${task.completed?"task-done":""} ${flashing?"task-flash":""} ${task.dramaLevel>=9?"task-apocalypse":""} ${isOverdue?"task-overdue":""}`}>
      {showReaction && <div className="task-reaction">🎉 {reaction}</div>}

      <div className="task-card-main">
        <button className={`task-check ${task.completed?"checked":""}`} onClick={handleToggle}>
          {task.completed ? "✓" : ""}
        </button>

        <div className="task-body">
          <div className="task-title-row">
            <span className={`task-title ${task.completed?"task-title-done":""}`}>{task.title}</span>
            <div className="task-badges">
              {task.isRecurring && <span className="task-badge badge-recurring" title="Recurring task">🔄 Recurring</span>}
              {task.priority && task.priority !== "medium" && (
                <span className="task-badge badge-priority">{PRIORITY_ICONS[task.priority]} {task.priority}</span>
              )}
            </div>
          </div>
          {task.description && <span className="task-desc">{task.description}</span>}

          <div className="task-meta">
            {task.category && (
              <span className="task-cat" style={{color:task.category.color,borderColor:task.category.color+"44"}}>
                {task.category.icon} {task.category.name}
              </span>
            )}
            {task.dueDate && (
              <span className={`task-due ${isOverdue?"overdue":""}`}>
                {isOverdue ? "💀 OVERDUE:" : "📅"} {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
            {/* Attachment: authenticated fetch, not raw URL */}
            {task.attachment?.originalName && (
              <AttachmentLink attachment={task.attachment} />
            )}
          </div>

          {task.dramaHistory?.length > 1 && (
            <button className="history-toggle" onClick={() => setShowHistory(h => !h)}>
              {showHistory ? "Hide" : "Show"} drama history ({task.dramaHistory.length} events)
            </button>
          )}
          {showHistory && (
            <div className="drama-history">
              {task.dramaHistory.slice().reverse().map((h, i) => (
                <div key={i} className="history-item">
                  <span className="history-event">{h.event==="created"?"📝":h.event==="completed"?"✅":h.event==="escalated"?"📈":"✏️"} {h.event}</span>
                  <span className="history-level">Level {h.dramaLevel}</span>
                  <span className="history-date">{new Date(h.date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="task-card-right">
        <span className="task-drama-badge" style={{color:drama.color,background:drama.bg,borderColor:drama.color+"44"}}>
          {task.dramaLevel}/10 — {drama.text}
        </span>
        <button className="task-delete-btn" onClick={handleDelete} title="Obliterate">🗑️</button>
      </div>
    </div>
  );
}
