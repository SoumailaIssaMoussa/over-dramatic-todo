import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser, getGoogleAuthUrl } from "../services/api";
import "./Auth.css";

export default function Register() {
  const [form, setForm] = useState({ name:"", email:"", password:"", signature:"" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const { token, user } = await registerUser(form.name, form.email, form.password, form.signature);
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      navigate("/tasks");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">🎭</div>
        <h1 className="auth-title">Join the Suffering</h1>
        <p className="auth-sub">Create an account to begin your dramatic journey.</p>

        {error && <div className="auth-error">⚡ {error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" value={form.name} onChange={set("name")} placeholder="Your Tragic Name" required autoFocus />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={set("email")} placeholder="your@suffering.com" required />
          </div>
          <div className="form-group">
            <label>Password (min 6 characters)</label>
            <input type="password" value={form.password} onChange={set("password")} placeholder="••••••••" required />
          </div>
          <div className="form-group">
            <label>Dramatic Motto <span style={{opacity:.5,fontSize:".8rem"}}>(optional)</span></label>
            <input type="text" value={form.signature} onChange={set("signature")} placeholder="e.g. Every task is a battle I did not ask for." maxLength={100} />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? "Creating your tragedy…" : "🎭 Begin My Suffering"}
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
          Sign up with Google
        </a>

        <p className="auth-link">Already suffering? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
