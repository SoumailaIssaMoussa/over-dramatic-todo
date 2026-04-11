import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

// Mood accent colours (used by both light and dark)
export const MOOD_THEMES = {
  calm:        { accent: "#667eea", accentDim: "rgba(102,126,234,0.15)", glow: "rgba(102,126,234,0.12)",  emoji: "😌", label: "Calm",        accentDark: "#10b981", accentDimDark: "rgba(16,185,129,0.15)",  glowDark: "rgba(16,185,129,0.12)"  },
  tense:       { accent: "#f59e0b", accentDim: "rgba(245,158,11,0.15)",  glow: "rgba(245,158,11,0.12)",  emoji: "😤", label: "Tense",       accentDark: "#f59e0b", accentDimDark: "rgba(245,158,11,0.15)",  glowDark: "rgba(245,158,11,0.12)"  },
  dramatic:    { accent: "#764ba2", accentDim: "rgba(118,75,162,0.15)",  glow: "rgba(118,75,162,0.15)",  emoji: "🎭", label: "Dramatic",    accentDark: "#8b5cf6", accentDimDark: "rgba(139,92,246,0.15)",  glowDark: "rgba(139,92,246,0.15)"  },
  catastrophic:{ accent: "#e53e3e", accentDim: "rgba(229,62,62,0.15)",   glow: "rgba(229,62,62,0.2)",    emoji: "💀", label: "Catastrophic", accentDark: "#ef4444", accentDimDark: "rgba(239,68,68,0.15)",   glowDark: "rgba(239,68,68,0.2)"    },
};

// ── Light theme CSS variable sets (original purple/indigo palette) ─────────
function applyLightVars(moodKey) {
  const t = MOOD_THEMES[moodKey] || MOOD_THEMES.dramatic;
  const r = document.documentElement;
  r.style.setProperty("--accent",        t.accent);
  r.style.setProperty("--accent2",       "#764ba2");
  r.style.setProperty("--accent-dim",    t.accentDim);
  r.style.setProperty("--accent-hover",  t.accent);
  r.style.setProperty("--mood-glow",     `0 0 40px ${t.glow}`);

  r.style.setProperty("--bg-primary",    "#f8f9fa");
  r.style.setProperty("--bg-secondary",  "#ffffff");
  r.style.setProperty("--bg-card",       "#ffffff");
  r.style.setProperty("--bg-elevated",   "#f7fafc");

  r.style.setProperty("--text-primary",  "#2d3748");
  r.style.setProperty("--text",          "#2d3748");
  r.style.setProperty("--text-dim",      "#718096");
  r.style.setProperty("--text-muted",    "#a0aec0");

  r.style.setProperty("--border",        "#e2e8f0");

  r.style.setProperty("--green",  "#48bb78");
  r.style.setProperty("--gold",   "#f6ad55");
  r.style.setProperty("--red",    "#e53e3e");

  r.style.setProperty("--radius",    "12px");
  r.style.setProperty("--radius-sm", "8px");
  r.style.setProperty("--radius-md", "12px");
  r.style.setProperty("--radius-lg", "18px");
  r.style.setProperty("--shadow",    "0 10px 30px rgba(0,0,0,0.10)");

  r.style.setProperty("--border-bright", "#cbd5e0");
  r.style.setProperty("--bg-deep",       "#f7fafc");
  r.style.setProperty("--shadow-glow",   `0 0 30px ${t.accentDim}`);
  r.style.setProperty("--font-title", "'Segoe UI', system-ui, sans-serif");
  r.style.setProperty("--font-body",  "'Segoe UI', system-ui, sans-serif");
}

// ── Dark theme CSS variable sets (original upgraded dark palette) ──────────
function applyDarkVars(moodKey) {
  const t = MOOD_THEMES[moodKey] || MOOD_THEMES.dramatic;
  const bgCards = { calm: "#1c2128", tense: "#1c1a10", dramatic: "#1c1828", catastrophic: "#1c0f0f" };
  const r = document.documentElement;
  r.style.setProperty("--accent",        t.accentDark);
  r.style.setProperty("--accent2",       t.accentDark);
  r.style.setProperty("--accent-dim",    t.accentDimDark);
  r.style.setProperty("--accent-hover",  t.accentDark);
  r.style.setProperty("--mood-glow",     `0 0 40px ${t.glowDark}`);

  r.style.setProperty("--bg-primary",    "#0d1117");
  r.style.setProperty("--bg-secondary",  "#161b22");
  r.style.setProperty("--bg-card",       bgCards[moodKey] || "#1c1828");
  r.style.setProperty("--bg-elevated",   "#21262d");

  r.style.setProperty("--text-primary",  "#e6edf3");
  r.style.setProperty("--text",          "#e6edf3");
  r.style.setProperty("--text-dim",      "#7d8590");
  r.style.setProperty("--text-muted",    "#484f58");

  r.style.setProperty("--border",        "rgba(255,255,255,0.08)");

  r.style.setProperty("--green",  "#4ade80");
  r.style.setProperty("--gold",   "#fbbf24");
  r.style.setProperty("--red",    "#ef4444");

  r.style.setProperty("--radius",    "12px");
  r.style.setProperty("--radius-sm", "8px");
  r.style.setProperty("--radius-md", "12px");
  r.style.setProperty("--radius-lg", "18px");
  r.style.setProperty("--shadow",    "0 8px 32px rgba(0,0,0,0.4)");

  r.style.setProperty("--border-bright", "rgba(255,255,255,0.18)");
  r.style.setProperty("--bg-deep",       "#0d1117");
  r.style.setProperty("--shadow-glow",   `0 0 30px ${t.accentDimDark}`);
  r.style.setProperty("--font-title", "'Segoe UI', system-ui, sans-serif");
  r.style.setProperty("--font-body",  "'Segoe UI', system-ui, sans-serif");
}

export function ThemeProvider({ children }) {
  const [mood, setMood] = useState(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.dramaMood || "dramatic";
  });

  const [colorMode, setColorMode] = useState(() => {
    return localStorage.getItem("colorMode") || "light";
  });

  useEffect(() => {
    if (colorMode === "light") {
      applyLightVars(mood);
      document.documentElement.setAttribute("data-theme", "light");
      document.body.className = `mood-${mood} theme-light`;
    } else {
      applyDarkVars(mood);
      document.documentElement.setAttribute("data-theme", "dark");
      document.body.className = `mood-${mood} theme-dark`;
    }
  }, [mood, colorMode]);

  const updateMood = (m) => {
    setMood(m);
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    localStorage.setItem("user", JSON.stringify({ ...user, dramaMood: m }));
  };

  const toggleColorMode = () => {
    const next = colorMode === "light" ? "dark" : "light";
    setColorMode(next);
    localStorage.setItem("colorMode", next);
  };

  return (
    <ThemeContext.Provider value={{ mood, updateMood, themes: MOOD_THEMES, colorMode, toggleColorMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
