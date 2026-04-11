import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getProfile, updateProfile, changePassword, uploadAvatar, fetchDramaTrend, fetchStats, setMoodOverride } from "../services/api";
import { useTheme, MOOD_THEMES } from "../context/ThemeContext";
import { fetchFileObjectUrl } from "../services/api";
import Header from "../components/Header";
import "./Profile.css";

const BADGE_INFO = {
  first_crisis:    { emoji:"🎭", label:"First Crisis",    desc:"Declared your first task." },
  first_survivor:  { emoji:"🏆", label:"First Survivor",  desc:"Completed your first task." },
  drama_veteran:   { emoji:"⚔️", label:"Drama Veteran",   desc:"Completed 10 tasks." },
  chaos_magnet:    { emoji:"🌪️", label:"Chaos Magnet",    desc:"Had 3+ catastrophic tasks." },
  crisis_collector:{ emoji:"💼", label:"Crisis Collector", desc:"Created 50+ tasks." },
  agent_of_chaos:  { emoji:"😈", label:"Agent of Chaos",  desc:"Avg drama level 8+." },
};

// Simple bar chart component for a single trend series
function TrendChart({ data, valueKey = "count", label, colorFn }) {
  if (!data?.length) return (
    <div className="chart-empty">📭 No data yet for this period.</div>
  );
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  return (
    <div className="drama-chart" role="img" aria-label={label}>
      {data.slice(-14).map((d, i) => {
        const val = d[valueKey] ?? 0;
        const pct = (val / max) * 100;
        const color = colorFn ? colorFn(val) : "var(--accent)";
        return (
          <div key={i} className="chart-col" title={`${d.date}: ${val}`}>
            <div className="chart-bar-wrap">
              <div className="chart-bar" style={{ height:`${pct}%`, background: color }} />
            </div>
            <span className="chart-label">{new Date(d.date).getDate()}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { mood, updateMood, themes } = useTheme();
  const fileRef = useRef();
  const token = localStorage.getItem("token");

  const [profile, setProfile]             = useState(null);
  const [stats, setStats]                 = useState(null);
  const [trend, setTrend]                 = useState(null);
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [pwSaving, setPwSaving]           = useState(false);
  const [toast, setToast]                 = useState(null);
  const [form, setForm]                   = useState({ name:"", email:"", signature:"" });
  const [formErrors, setFormErrors]       = useState({});
  const [pw, setPw]                       = useState({ old:"", newP:"", confirm:"" });
  const [pwErrors, setPwErrors]           = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile]       = useState(null);
  const [moodOverrideLocal, setMoodOverrideLocal] = useState(false);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [p, s, t] = await Promise.all([getProfile(), fetchStats(), fetchDramaTrend(30)]);
      setProfile(p);
      setStats(s);
      setTrend(t);
      setForm({ name: p.name, email: p.email, signature: p.signature || "" });
      setMoodOverrideLocal(s.moodOverride || false);
    } catch (err) { showToast(err.message, "error"); }
    finally { setLoading(false); }
  };

  const showToast = (message, type="success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Avatar — use authenticated fetch to show current avatar
  useEffect(() => {
    if (!profile?.avatar || avatarPreview) return;
    const filename = profile.avatar.split("/api/upload/")[1];
    if (!filename) { setAvatarPreview(profile.avatar); return; }
    fetchFileObjectUrl(filename)
      .then(url => setAvatarPreview(url))
      .catch(() => {});
  }, [profile?.avatar]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { showToast("Please select an image file.", "error"); return; }
    if (file.size > 5 * 1024 * 1024) { showToast("File too large (max 5MB)", "error"); return; }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const validateProfileForm = () => {
    const errors = {};
    if (!form.name.trim())  errors.name  = "Name cannot be empty.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) errors.email = "Invalid email address.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!validateProfileForm()) return;
    setSaving(true);
    try {
      // Upload new avatar first if changed
      if (avatarFile) {
        const { avatar } = await uploadAvatar(avatarFile);
        setProfile(p => ({ ...p, avatar }));
        setAvatarFile(null);
      }
      const updated = await updateProfile({ name: form.name.trim(), email: form.email.trim().toLowerCase(), signature: form.signature });
      setProfile(updated);
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...stored, name: updated.name, email: updated.email }));
      showToast("✅ Profile saved successfully.");
    } catch (err) { showToast(err.message, "error"); }
    finally { setSaving(false); }
  };

  const validatePw = () => {
    const errors = {};
    if (!pw.old)  errors.old  = "Current password is required.";
    if (!pw.newP) errors.newP = "New password is required.";
    else if (pw.newP.length < 6) errors.newP = "Must be at least 6 characters.";
    if (pw.newP !== pw.confirm) errors.confirm = "Passwords do not match.";
    setPwErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!validatePw()) return;
    setPwSaving(true);
    try {
      await changePassword(pw.old, pw.newP);
      setPw({ old:"", newP:"", confirm:"" });
      showToast("🔑 Password updated successfully.");
    } catch (err) { showToast(err.message, "error"); }
    finally { setPwSaving(false); }
  };

  const handleMoodChange = async (key) => {
    updateMood(key);
    if (moodOverrideLocal) {
      // When override is on, persist manual mood to backend too
      try { await setMoodOverride(true, key); } catch {}
    }
    try { await updateProfile({ dramaMood: key }); } catch {}
  };

  const handleOverrideToggle = async (enabled) => {
    setMoodOverrideLocal(enabled);
    try {
      await setMoodOverride(enabled, enabled ? mood : undefined);
      showToast(enabled ? "🔒 Mood locked to manual." : "🔄 Mood set to automatic.");
    } catch (err) { showToast(err.message, "error"); }
  };

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const avatarSrc = avatarPreview || null;

  return (
    <div className="profile-layout">
      <Header user={user} onSearchChange={() => {}} />
      <div className="profile-body">
        <div className="profile-sidebar">
          <Link to="/tasks" className="back-link">← Back to Crises</Link>
          <div className="profile-avatar-wrap">
            <div className="profile-avatar" onClick={() => fileRef.current?.click()}>
              {avatarSrc
                ? <img src={avatarSrc} alt="avatar" />
                : <span>{user.name?.charAt(0).toUpperCase()}</span>
              }
              <div className="avatar-overlay">📷</div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleAvatarChange} />
            <p className="avatar-hint">Click to change photo</p>
          </div>
          {!loading && (
            <div className="profile-sidebar-info">
              <h2 className="profile-name">{profile?.name}</h2>
              <p className="profile-email">{profile?.email}</p>
              {profile?.signature && <p className="profile-signature">"{profile.signature}"</p>}
              <div className="profile-mood-tag" style={{ background:`${themes[mood]?.accent}22`, color:themes[mood]?.accent, borderColor:themes[mood]?.accent+"44" }}>
                {themes[mood]?.emoji} {themes[mood]?.label} Mood
              </div>
            </div>
          )}
        </div>

        <div className="profile-main">
          {loading ? (
            <div className="loading-state"><div className="drama-spinner">🎭</div><p>Loading your dramatic profile…</p></div>
          ) : (
            <>
              {/* Stats */}
              {stats && (
                <div className="profile-stats">
                  {[
                    { n:stats.total,       l:"Total Crises",    c:"var(--accent)" },
                    { n:stats.completed,   l:"Survived",         c:"#10b981" },
                    { n:stats.catastrophic,l:"Catastrophic",     c:"#ef4444" },
                    { n:stats.avgDrama,    l:"Avg Drama Level",  c:"#f59e0b" },
                  ].map(s => (
                    <div key={s.l} className="ps-tile">
                      <span className="ps-num" style={{color:s.c}}>{s.n}</span>
                      <span className="ps-lbl">{s.l}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Badges */}
              {stats?.badges?.length > 0 && (
                <section className="profile-section">
                  <h3 className="section-title">🏅 Earned Badges</h3>
                  <div className="badges-grid">
                    {stats.badges.map(b => {
                      const info = BADGE_INFO[b] || { emoji:"🎖️", label:b, desc:"" };
                      return (
                        <div key={b} className="badge-card" title={info.desc}>
                          <span className="badge-emoji">{info.emoji}</span>
                          <span className="badge-label">{info.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* ── Analytics — 4 separate, clearly-labelled charts ── */}
              {trend && (
                <section className="profile-section">
                  <h3 className="section-title">📊 Analytics (Last 30 Days)</h3>

                  <div className="analytics-summary">
                    <div className="ana-tile"><span>{trend.escalationCount}</span><small>Escalations</small></div>
                    <div className="ana-tile"><span>{trend.overdueCount}</span><small>Became Overdue</small></div>
                    <div className="ana-tile"><span>{trend.completionTrend?.reduce((s,d)=>s+d.count,0)||0}</span><small>Completed</small></div>
                    <div className="ana-tile"><span>{trend.createdTrend?.reduce((s,d)=>s+d.count,0)||0}</span><small>Created</small></div>
                  </div>

                  <h4 className="chart-title">📈 Drama Trend — avg drama level by day</h4>
                  <TrendChart data={trend.trend} valueKey="avgDrama" label="Drama trend chart"
                    colorFn={v => v>=8?"#ef4444":v>=6?"#f59e0b":v>=4?"var(--accent)":"#10b981"} />

                  <h4 className="chart-title">✅ Completion Trend — tasks completed by day</h4>
                  <TrendChart data={trend.completionTrend} valueKey="count" label="Completion trend chart"
                    colorFn={() => "#10b981"} />

                  <h4 className="chart-title">📝 Task Creation Trend — tasks created by day</h4>
                  <TrendChart data={trend.createdTrend} valueKey="count" label="Creation trend chart"
                    colorFn={() => "var(--accent)"} />

                  {/* Drama level distribution */}
                  <h4 className="chart-title">🎚️ Drama Level Distribution</h4>
                  <div className="level-dist">
                    {["1-2","3-4","5-6","7-8","9-10"].map((lbl,i) => (
                      <div key={lbl} className="dist-item">
                        <span className="dist-label">{lbl}</span>
                        <div className="dist-bar-bg">
                          <div className="dist-bar-fill" style={{ width:`${trend.levelDist[i]?(trend.levelDist[i]/Math.max(...trend.levelDist,1))*100:0}%` }} />
                        </div>
                        <span className="dist-count">{trend.levelDist[i]||0}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Edit Profile */}
              <section className="profile-section">
                <h3 className="section-title">✏️ Edit Profile</h3>
                <form onSubmit={handleSaveProfile} className="profile-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Name</label>
                      <input value={form.name} onChange={e => { setForm(f=>({...f,name:e.target.value})); setFormErrors(fe=>({...fe,name:""})); }} />
                      {formErrors.name && <span className="field-err">{formErrors.name}</span>}
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input type="email" value={form.email} onChange={e => { setForm(f=>({...f,email:e.target.value})); setFormErrors(fe=>({...fe,email:""})); }} />
                      {formErrors.email && <span className="field-err">{formErrors.email}</span>}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Dramatic Motto</label>
                    <input value={form.signature} onChange={e=>setForm(f=>({...f,signature:e.target.value}))} placeholder="e.g. Every task is a battle I did not ask for." maxLength={100} />
                    <span className="char-count">{form.signature.length}/100</span>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Saving…" : "💾 Save Profile"}
                  </button>
                </form>
              </section>

              {/* ── Mood selector — with override toggle ── */}
              <section className="profile-section">
                <h3 className="section-title">🎨 Drama Mood Theme</h3>

                {/* Override toggle */}
                <div className="mood-override-row">
                  <label className="override-toggle">
                    <input type="checkbox" checked={moodOverrideLocal} onChange={e=>handleOverrideToggle(e.target.checked)} />
                    <span className="override-label">
                      {moodOverrideLocal
                        ? "🔒 Manual mood — task changes won't affect it"
                        : "🔄 Auto mood — updates based on your tasks"}
                    </span>
                  </label>
                </div>

                <p className="section-desc">
                  {moodOverrideLocal
                    ? "You control the mood. Pick it below:"
                    : "Mood is set automatically by your task drama levels. Enable manual control to override."}
                </p>

                <div className={`mood-grid ${!moodOverrideLocal ? "mood-grid-auto" : ""}`}>
                  {Object.entries(MOOD_THEMES).map(([key, t]) => (
                    <button key={key}
                      className={`mood-option ${mood===key?"active":""} ${!moodOverrideLocal?"mood-option-disabled":""}`}
                      style={{ "--mo-accent":t.accent, borderColor:mood===key?t.accent:"var(--border)" }}
                      onClick={() => moodOverrideLocal && handleMoodChange(key)}
                      title={!moodOverrideLocal ? "Enable manual override to change mood" : undefined}
                    >
                      <span className="mood-emoji">{t.emoji}</span>
                      <span className="mood-label">{t.label}</span>
                      {mood===key && moodOverrideLocal && <span className="mood-check">✓</span>}
                    </button>
                  ))}
                </div>
              </section>

              {/* Change Password */}
              {!profile?.googleId && (
                <section className="profile-section">
                  <h3 className="section-title">🔒 Change Password</h3>
                  <form onSubmit={handleChangePassword} className="profile-form">
                    <div className="form-group">
                      <label>Current Password</label>
                      <input type="password" value={pw.old} onChange={e=>{setPw(p=>({...p,old:e.target.value}));setPwErrors(pe=>({...pe,old:""}));}} />
                      {pwErrors.old && <span className="field-err">{pwErrors.old}</span>}
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>New Password</label>
                        <input type="password" value={pw.newP} onChange={e=>{setPw(p=>({...p,newP:e.target.value}));setPwErrors(pe=>({...pe,newP:""}));}} />
                        {pwErrors.newP && <span className="field-err">{pwErrors.newP}</span>}
                      </div>
                      <div className="form-group">
                        <label>Confirm Password</label>
                        <input type="password" value={pw.confirm} onChange={e=>{setPw(p=>({...p,confirm:e.target.value}));setPwErrors(pe=>({...pe,confirm:""}));}} />
                        {pwErrors.confirm && <span className="field-err">{pwErrors.confirm}</span>}
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={pwSaving}>
                      {pwSaving ? "Updating…" : "🔑 Update Password"}
                    </button>
                  </form>
                </section>
              )}
            </>
          )}
        </div>
      </div>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
    </div>
  );
}
