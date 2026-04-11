import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const userRaw = params.get("user");

    if (token && userRaw) {
      try {
        const user = JSON.parse(decodeURIComponent(userRaw));
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        window.location.href = "/tasks";
      } catch {
        navigate("/login?error=parse_failed");
      }
    } else {
      navigate("/login?error=oauth_failed");
    }
  }, [navigate]);

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", gap:16 }}>
      <div style={{ fontSize:"3rem" }}>🎭</div>
      <p style={{ color:"var(--text-dim)" }}>Authenticating your dramatic identity…</p>
    </div>
  );
}