import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/api";
import "./Auth.css";

const DRAMA_QUOTES = [
  "Every task is a battle. Every deadline, a war.",
  "The inbox is empty. The soul is not.",
  "What is productivity but suffering with purpose?",
  "To complete a task is to cheat death... briefly.",
  "Your to-do list weeps in your absence.",
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const quote = DRAMA_QUOTES[Math.floor(Math.random() * DRAMA_QUOTES.length)];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await loginUser(email, password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/tasks");
    } catch (err) {
      setError(err.message || "The authentication gods have rejected you.");
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
          <h1 className="brand-title">Over-Dramatic<br />To-Do</h1>
          <p className="brand-subtitle">Where Every Task is a Tragedy</p>
        </div>

        <blockquote className="drama-quote">"{quote}"</blockquote>

        {error && (
          <div className="auth-alert">
            <span>⚡</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
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
            <label>Password</label>
            <div className="input-wrapper">
              <span className="input-icon">🔐</span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="input-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? (
              <><span className="spin">⚙️</span> Entering the Drama...</>
            ) : (
              <><span>🎭</span> Enter the Chaos</>
            )}
          </button>
        </form>

        <p className="auth-switch">
          New to the suffering?{" "}
          <Link to="/register">Join the drama →</Link>
        </p>
      </div>
    </div>
  );
}
