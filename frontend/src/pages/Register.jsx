import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../services/api";
import "./Auth.css";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters — even tragedy has standards.");
      return;
    }
    setLoading(true);
    try {
      const data = await registerUser(name, email, password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/tasks");
    } catch (err) {
      setError(err.message || "Registration failed. The universe rejects your existence.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-particles">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="particle" style={{ '--i': i }} />
          ))}
        </div>
      </div>

      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-icon">🎭</div>
          <h1 className="brand-title">Join the<br />Suffering</h1>
          <p className="brand-subtitle">Create your drama account</p>
        </div>

        {error && (
          <div className="auth-alert">
            <span>⚡</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Your Name (the name of a tragic hero)</label>
            <div className="input-wrapper">
              <span className="input-icon">🎭</span>
              <input
                type="text"
                placeholder="e.g. Romeo, Hamlet, Macbeth..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <span className="input-icon">📧</span>
              <input
                type="email"
                placeholder="your.suffering@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password (min 6 chars of despair)</label>
            <div className="input-wrapper">
              <span className="input-icon">🔐</span>
              <input
                type="password"
                placeholder="At least 6 characters of sorrow"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? (
              <><span className="spin">⚙️</span> Preparing your tragedy...</>
            ) : (
              <><span>🎭</span> Begin My Suffering</>
            )}
          </button>
        </form>

        <p className="auth-switch">
          Already suffering?{" "}
          <Link to="/login">Return to the drama →</Link>
        </p>
      </div>
    </div>
  );
}
