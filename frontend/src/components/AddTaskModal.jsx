import { useState, useEffect, useRef } from "react";
import DramaSlider from "./DramaSlider";
import { fetchCategories, createCategory, uploadFile } from "../services/api";
import "./AddTaskModal.css";

const PLACEHOLDERS = [
  "Survive the grocery run (life or death)",
  "Send email to boss (emotional ordeal)",
  "Clean room (Herculean feat of willpower)",
  "Call dentist (a brush with mortality)",
  "Pay rent (quarterly tragedy)",
  "Update CV (existential reckoning)",
];

const PRIORITY_OPTIONS = [
  { value:"low",        label:"🟢 Low",        color:"#10b981" },
  { value:"medium",     label:"🔵 Medium",     color:"#3b82f6" },
  { value:"high",       label:"🟠 High",        color:"#f59e0b" },
  { value:"apocalyptic",label:"💀 Apocalyptic", color:"#ef4444" },
];

export default function AddTaskModal({ onClose, onAdd }) {
  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [dramaLevel, setDramaLevel]   = useState(5);
  const [categoryId, setCategoryId]   = useState("");
  const [dueDate, setDueDate]         = useState("");
  const [priority, setPriority]       = useState("medium");
  const [categories, setCategories]   = useState([]);
  const [newCatName, setNewCatName]   = useState("");
  const [newCatIcon, setNewCatIcon]   = useState("🎭");
  const [showNewCat, setShowNewCat]   = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence]   = useState({ interval:"weekly", escalateOnMiss:true });
  const [attachment, setAttachment]   = useState(null);   // { filename, originalName, mimetype, size, url }
  const [uploading, setUploading]     = useState(false);
  const [uploadPct, setUploadPct]     = useState(0);
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);
  const fileInputRef                  = useRef();

  const placeholder = PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)];

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  // Real file upload via FormData → /api/upload
  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ALLOWED_TYPES = ["image/jpeg","image/png","image/gif","image/webp","application/pdf","text/plain",
      "application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
    if (!ALLOWED_TYPES.includes(file.type)) { setError("File type not allowed. Use images, PDF, Word or Excel."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("File too large (max 5MB). Even tragedy has limits."); return; }
    setUploading(true); setUploadPct(0); setError("");
    try {
      // Fake progress while awaiting
      const timer = setInterval(() => setUploadPct(p => Math.min(p + 15, 85)), 200);
      const result = await uploadFile(file);
      clearInterval(timer); setUploadPct(100);
      setAttachment(result);
    } catch (err) {
      setError("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = () => { setAttachment(null); setUploadPct(0); if (fileInputRef.current) fileInputRef.current.value = ""; };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    // Client-side duplicate check
    if (categories.some(c => c.name.toLowerCase() === newCatName.trim().toLowerCase())) {
      setError(`Category "${newCatName.trim()}" already exists.`); return;
    }
    try {
      const cat = await createCategory({ name: newCatName, icon: newCatIcon });
      setCategories(c => [...c, cat]);
      setCategoryId(cat._id);
      setShowNewCat(false); setNewCatName("");
    } catch (err) { setError(err.message); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim())            { setError("A crisis needs a name."); return; }
    if (title.trim().length > 200){ setError("Title too long (max 200 characters)."); return; }
    if (dueDate && isNaN(Date.parse(dueDate))) { setError("Invalid due date."); return; }
    if (isRecurring && !["daily","weekly","monthly"].includes(recurrence.interval))
      { setError("Please choose a valid recurrence interval."); return; }
    if (uploading) { setError("Please wait for the file to finish uploading."); return; }
    setError(""); setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        dramaLevel,
        category: categoryId || undefined,
        dueDate: dueDate || undefined,
        priority,
        isRecurring,
        recurrence: isRecurring ? recurrence : undefined,
        attachment: attachment || undefined,
      };
      await onAdd(payload);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create crisis.");
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">🎭 Declare a New Crisis</h2>
            <p className="modal-sub">Every task is a performance. Make it count.</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="modal-error"><span>⚡</span> {error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Task Title *</label>
            <input type="text" placeholder={placeholder} value={title} onChange={e=>setTitle(e.target.value)} required autoFocus />
          </div>

          <div className="form-group">
            <label>The Full Tragedy (description)</label>
            <textarea placeholder="Describe the suffering in detail…" value={description} onChange={e=>setDescription(e.target.value)} rows={3} />
          </div>

          <div className="form-group">
            <label>Drama Level</label>
            <DramaSlider value={dramaLevel} onChange={setDramaLevel} />
          </div>

          {/* Priority */}
          <div className="form-group">
            <label>Priority</label>
            <div className="priority-row">
              {PRIORITY_OPTIONS.map(p => (
                <button key={p.value} type="button"
                  className={`priority-btn ${priority===p.value?"active":""}`}
                  style={{ "--p-color": p.color }}
                  onClick={() => setPriority(p.value)}
                >{p.label}</button>
              ))}
            </div>
          </div>

          <div className="modal-row">
            {/* Category */}
            <div className="form-group" style={{flex:1}}>
              <label>Category</label>
              <div style={{display:"flex",gap:6}}>
                <select value={categoryId} onChange={e=>setCategoryId(e.target.value)} style={{flex:1}}>
                  <option value="">No category</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
                </select>
                <button type="button" className="btn btn-ghost" onClick={()=>setShowNewCat(v=>!v)} title="New category">+</button>
              </div>
              {showNewCat && (
                <div className="new-cat-form">
                  <div style={{display:"flex",gap:6}}>
                    <input type="text" placeholder="Category name" value={newCatName} onChange={e=>setNewCatName(e.target.value)} style={{flex:1}} />
                    <input type="text" placeholder="🎭" value={newCatIcon} onChange={e=>setNewCatIcon(e.target.value)} style={{width:55}} />
                    <button type="button" className="btn btn-primary" onClick={handleAddCategory} style={{padding:"10px 14px"}}>Add</button>
                  </div>
                </div>
              )}
            </div>
            {/* Due date */}
            <div className="form-group" style={{flex:1}}>
              <label>Deadline (Day of Reckoning)</label>
              <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} />
            </div>
          </div>

          {/* Recurring */}
          <div className="form-group recurring-toggle">
            <label className="toggle-label">
              <input type="checkbox" checked={isRecurring} onChange={e=>setIsRecurring(e.target.checked)} />
              <span className="toggle-text">🔄 Recurring Task</span>
              <span className="toggle-sub">It shall return, again and again…</span>
            </label>
            {isRecurring && (
              <div className="recurring-opts">
                <select value={recurrence.interval} onChange={e=>setRecurrence(r=>({...r,interval:e.target.value}))}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <label className="toggle-label">
                  <input type="checkbox" checked={recurrence.escalateOnMiss}
                    onChange={e=>setRecurrence(r=>({...r,escalateOnMiss:e.target.checked}))} />
                  <span>Escalate drama when overdue</span>
                </label>
              </div>
            )}
          </div>

          {/* File upload — real FormData upload */}
          <div className="form-group">
            <label>Attach Evidence <span style={{opacity:.5,fontSize:".78rem"}}>(stored on server, downloadable)</span></label>
            <div className="file-upload-area">
              <input ref={fileInputRef} type="file" id="file-input" onChange={handleFile} style={{display:"none"}}
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.doc,.docx,.xls,.xlsx" />
              {attachment ? (
                <div className="file-chosen-bar">
                  <span className="file-icon">{attachment.mimetype?.includes("image") ? "🖼️" : attachment.mimetype?.includes("pdf") ? "📄" : "📎"}</span>
                  <div className="file-info">
                    <a href={attachment.url} target="_blank" rel="noreferrer" className="file-link">{attachment.originalName}</a>
                    <span className="file-size">{(attachment.size/1024).toFixed(1)} KB — click to preview</span>
                  </div>
                  <button type="button" className="btn btn-ghost" onClick={removeAttachment} style={{fontSize:".75rem",padding:"4px 8px"}}>Remove</button>
                </div>
              ) : uploading ? (
                <div className="upload-progress">
                  <div className="progress-bar"><div className="progress-fill" style={{width:`${uploadPct}%`}} /></div>
                  <span>Uploading your evidence… {uploadPct}%</span>
                </div>
              ) : (
                <label htmlFor="file-input" className="file-upload-label">
                  <span>📁 Click to attach a document of suffering (max 5MB)</span>
                  <span className="file-types">Images, PDF, Word, Excel accepted</span>
                </label>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Flee from Responsibility</button>
            <button type="submit" className="btn btn-primary" disabled={loading || uploading}>
              {loading ? <><span className="spin-small">⚙️</span> Declaring crisis…</> : "🎭 Declare This Crisis"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
