import { useState, useEffect } from "react";
import { generateStory } from "../services/api";
import "./StoryModal.css";

export default function StoryModal({ onClose }) {
  const [story, setStory]     = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true); setError("");
    try {
      const { story } = await generateStory();
      setStory(story);
    } catch (err) {
      setError("The oracle is silent. Check your API key or try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="story-overlay" onClick={onClose}>
      <div className="story-box" onClick={e => e.stopPropagation()}>
        <div className="story-header">
          <div>
            <h2 className="story-title">📖 The Chronicles of Suffering</h2>
            <p className="story-sub">AI-generated dramatic summary of your task list</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="story-body">
          {loading ? (
            <div className="story-loading">
              <div className="story-quill">🪶</div>
              <p>The oracle is composing your tragic tale…</p>
              <div className="story-dots"><span /><span /><span /></div>
            </div>
          ) : error ? (
            <div className="story-error">
              <p>⚡ {error}</p>
              <button className="btn btn-primary" onClick={load}>Try Again</button>
            </div>
          ) : (
            <div className="story-text">
              {story.split("\n").map((para, i) => para.trim() ? <p key={i}>{para}</p> : null)}
            </div>
          )}
        </div>

        {!loading && !error && (
          <div className="story-footer">
            <span className="story-credit">✨ </span>
            <div style={{display:"flex",gap:10}}>
              <button className="btn btn-secondary" onClick={load}>🔄 Regenerate</button>
              <button className="btn btn-primary"   onClick={onClose}>Close the Chronicles</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
