import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";


function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Erreur de connexion");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/tasks");
    } catch (err) {
      setError("Impossible de joindre le serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="title">🎭 Over-Dramatic</h1>
        <p className="subtitle">Because every task deserves drama</p>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label>Email</label>
          </div>

          <div className="input-group">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label>Password</label>
          </div>

          <button disabled={loading}>
            {loading ? "Connexion..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
