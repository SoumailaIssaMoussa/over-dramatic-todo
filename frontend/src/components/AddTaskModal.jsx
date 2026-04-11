import { useState, useEffect } from "react";
import DramaSlider from "./DramaSlider";
import { fetchCategories, createCategory } from "../services/api";
import "./AddTaskModal.css";

const DRAMATIC_PLACEHOLDERS = [
  "Survive the grocery run (life or death)",
  "Send email to boss (emotional ordeal)",
  "Clean room (Herculean feat of willpower)",
  "Call dentist (a brush with mortality)",
  "Pay rent (quarterly tragedy)",
  "Update CV (existential reckoning)",
];

export default function AddTaskModal({ onClose, onAdd }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dramaLevel, setDramaLevel] = useState(5);
  const [categoryId, setCategoryId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("🎭");
  const [showNewCat, setShowNewCat] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const placeholder = DRAMATIC_PLACEHOLDERS[Math.floor(Math.random() * DRAMATIC_PLACEHOLDERS.length)];

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("File too large (max 5MB). Even tragedy has limits.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAttachment({ data: ev.target.result, originalName: file.name, mimetype: file.type, size: file.size });
    };
    reader.readAsDataURL(file);
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const cat = await createCategory({ name: newCatName, icon: newCatIcon });
      setCategories([...categories, cat]);
      setCategoryId(cat._id);
      setShowNewCat(false);
      setNewCatName("");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setError("A crisis needs a name."); return; }
    setError("");
    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        dramaLevel,
        category: categoryId || undefined,
        dueDate: dueDate || undefined,
        attachment: attachment ? {
          originalName: attachment.originalName,
          mimetype: attachment.mimetype,
          size: attachment.size,
          filename: attachment.originalName,
        } : undefined,
      };
      await onAdd(payload);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create crisis.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">🎭 Declare a New Crisis</h2>
            <p className="modal-sub">Every task is a performance. Make it count.</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div className="modal-error">
            <span>⚡</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Task Title *</label>
            <input
              type="text"
              placeholder={placeholder}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>The Full Tragedy (description)</label>
            <textarea
              placeholder="Describe the suffering in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Drama Level</label>
            <DramaSlider value={dramaLevel} onChange={setDramaLevel} />
          </div>

          <div className="modal-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Category</label>
              <div style={{ display: "flex", gap: 6 }}>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ flex: 1 }}>
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.icon} {c.name}</option>
                  ))}
                </select>
                <button type="button" className="btn btn-ghost" onClick={() => setShowNewCat(!showNewCat)} title="New category">+</button>
              </div>
              {showNewCat && (
                <div className="new-cat-form">
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      type="text"
                      placeholder="Category name"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <input
                      type="text"
                      placeholder="🎭"
                      value={newCatIcon}
                      onChange={(e) => setNewCatIcon(e.target.value)}
                      style={{ width: 60 }}
                    />
                    <button type="button" className="btn btn-primary" onClick={handleAddCategory} style={{ padding: "10px 14px" }}>Add</button>
                  </div>
                </div>
              )}
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label>Deadline (Day of Reckoning)</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label>Attach Evidence (file upload)</label>
            <div className="file-upload-area">
              <input type="file" id="file-input" onChange={handleFile} style={{ display: "none" }} />
              <label htmlFor="file-input" className="file-upload-label">
                {attachment ? (
                  <span className="file-chosen">📎 {attachment.originalName} ({(attachment.size/1024).toFixed(1)}KB)</span>
                ) : (
                  <span>📁 Click to attach a document of suffering (max 5MB)</span>
                )}
              </label>
              {attachment && (
                <button type="button" className="btn btn-ghost" onClick={() => setAttachment(null)} style={{ padding: "4px 8px", fontSize: "0.75rem" }}>Remove</button>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Flee from Responsibility</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spin-small">⚙️</span> Declaring crisis...</> : "🎭 Declare This Crisis"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
