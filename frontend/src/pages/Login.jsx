import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { loginUser, getGoogleAuthUrl } from "../services/api";
import { useTheme } from "../context/ThemeContext";
import "./Auth.css";
import "./LampLogin.css";

/* ─── Lamp SVG — pull cord to toggle dark/light mode ─── */
function CuteLamp({ onToggle, isLight }) {
  const beadRef  = useRef(null);
  const lineRef  = useRef(null);
  const hitRef   = useRef(null);
  const dragging = useRef(false);
  const startY   = useRef(0);
  const currY    = useRef(0);

  const applyY = (y) => {
    const clamped = Math.max(0, Math.min(y, 58));
    if (beadRef.current) beadRef.current.setAttribute("cy", 182 + clamped);
    if (lineRef.current) lineRef.current.setAttribute("y2", 172 + clamped);
    if (hitRef.current)  hitRef.current.setAttribute("cy", 182 + clamped);
  };

  const spring = () => {
    let pos = currY.current;
    const tick = () => {
      pos *= 0.72;
      if (Math.abs(pos) < 0.3) { applyY(0); currY.current = 0; return; }
      applyY(pos);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const onPointerDown = (e) => {
    e.preventDefault();
    dragging.current = true;
    startY.current   = e.clientY - currY.current;
    hitRef.current?.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragging.current) return;
    currY.current = e.clientY - startY.current;
    applyY(currY.current);
  };
  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (currY.current > 28) onToggle();
    spring();
  };

  return (
    <div className={`lamp-wrap ${isLight ? "lamp-on" : ""}`} aria-label="Pull cord to toggle light/dark mode">
      <svg className="lamp-svg" viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
        {/* ambient glow */}
        <ellipse className="lamp-glow" cx="100" cy="114" rx="60" ry="28" />
        {/* stem */}
        <rect className="lamp-base" x="93" y="105" width="14" height="155" rx="7" />
        {/* foot */}
        <rect className="lamp-base" x="60" y="252" width="80" height="11" rx="5.5" />
        <ellipse className="lamp-base" cx="100" cy="264" rx="30" ry="5" />
        {/* pull cord */}
        <line ref={lineRef} className="lamp-cord" x1="134" y1="114" x2="134" y2="172" />
        <circle ref={beadRef} className="lamp-bead" cx="134" cy="182" r="7" />
        {/* invisible hit target — drag this */}
        <circle
          ref={hitRef}
          cx="134" cy="182" r="26"
          fill="transparent"
          style={{ cursor: "grab", touchAction: "none" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
        {/* mushroom shade */}
        <path className="lamp-shade" d="M24 114 C 24 48, 176 48, 176 114 C 176 130, 24 130, 24 114 Z" />
        {/* highlight on shade */}
        <path fill="rgba(255,255,255,0.07)" d="M58 80 C 64 62, 136 62, 142 80 C 122 70, 78 70, 58 80 Z" />
      </svg>
      <span className="lamp-hint">{isLight ? "pull to dim" : "pull cord to switch"}</span>
    </div>
  );
}

export default function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const navigate                = useNavigate();
  const [params]                = useSearchParams();
  const { colorMode, toggleColorMode } = useTheme();
  const isLight = colorMode === "light";

  useEffect(() => { if (params.get("error")) setError("Google sign-in failed. Try again."); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim())    { setError("Email is required."); return; }
    if (!password)        { setError("Password is required."); return; }
    setError(""); setLoading(true);
    try {
      const { token, user } = await loginUser(email.trim().toLowerCase(), password);
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      navigate("/tasks");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page lamp-layout">

      {/* ── Lamp ── */}
      <CuteLamp onToggle={toggleColorMode} isLight={isLight} />

      {/* ── Card ── */}
      <div className="auth-card">
        <div className="auth-brand">🎭</div>
        <h1 className="auth-title">Over-Dramatic To-Do</h1>
        <p className="auth-sub">Your crises await. Sign in to face them.</p>

        {error && <div className="auth-error">⚡ {error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email" value={email}
              onChange={e => setError("") || setEmail(e.target.value)}
              placeholder="your@suffering.com" required autoFocus
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password" value={password}
              onChange={e => setError("") || setPassword(e.target.value)}
              placeholder="••••••••" required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? "Entering the drama…" : "🎭 Enter the Drama"}
          </button>
        </form>

        <div className="auth-divider"><span>or</span></div>

        <a href={getGoogleAuthUrl()} className="btn btn-google btn-full">
          <svg width="18" height="18" viewBox="0 0 48 48" style={{marginRight:8}}>
            <path fill="#EA4335" d="M24 9.5c3.1 0 5.6 1.1 7.6 2.9l5.7-5.7C33.9 3.5 29.3 1.5 24 1.5 14.9 1.5 7.2 7.1 4 15l6.7 5.2C12.4 13.5 17.7 9.5 24 9.5z"/>
            <path fill="#34A853" d="M46.5 24c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 2.9-2.2 5.4-4.6 7.1l7.2 5.6C43.8 36.6 46.5 30.7 46.5 24z"/>
            <path fill="#FBBC05" d="M10.7 28.3A14.6 14.6 0 0 1 9.5 24c0-1.5.3-3 .7-4.3L4.1 14.5A22.5 22.5 0 0 0 1.5 24c0 3.6.9 6.9 2.5 9.9l6.7-5.6z"/>
            <path fill="#4285F4" d="M24 46.5c5.4 0 9.9-1.8 13.2-4.8l-7.2-5.6c-1.8 1.2-4.1 1.9-6 1.9-6.3 0-11.6-4-13.4-9.5l-6.7 5.2C7.2 40.9 14.9 46.5 24 46.5z"/>
          </svg>
          Continue with Google
        </a>

        <p className="auth-link">No account yet? <Link to="/register">Join the drama</Link></p>
      </div>
    </div>
  );
}
