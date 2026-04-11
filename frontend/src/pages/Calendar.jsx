import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { fetchCalendar } from "../services/api";
import Header from "../components/Header";
import "./Calendar.css";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function getDramaColor(level) {
  if (level <= 2) return "#10b981";
  if (level <= 4) return "#3b82f6";
  if (level <= 6) return "#f59e0b";
  if (level <= 8) return "#ef4444";
  return "#a855f7";
}

export default function Calendar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user  = JSON.parse(localStorage.getItem("user") || "{}");
  const now   = new Date();

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());
  const [data,  setData]  = useState({ grouped:{}, tasks:[] });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // date string

  useEffect(() => { if (!token) navigate("/login"); }, []);
  useEffect(() => { load(); }, [month, year]);

  const load = async () => {
    setLoading(true);
    try {
      const d = await fetchCalendar(month, year);
      setData(d);
    } catch {}
    finally { setLoading(false); }
  };

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y=>y-1); } else setMonth(m=>m-1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y=>y+1); } else setMonth(m=>m+1); };

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const todayStr = now.toISOString().split("T")[0];
  const selectedTasks = selected ? (data.grouped[selected] || []) : [];

  return (
    <div className="calendar-layout">
      <Header user={user} onSearchChange={() => {}} />
      <div className="calendar-body">
        <div className="cal-top">
          <Link to="/tasks" className="back-link">← Back to Crises</Link>
          <h2 className="cal-heading">📅 Calendar of Catastrophes</h2>
          <p className="cal-sub">Every deadline is a reckoning.</p>
        </div>

        <div className="cal-wrap">
          {/* Calendar Panel */}
          <div className="cal-panel">
            <div className="cal-nav">
              <button className="cal-nav-btn" onClick={prevMonth}>‹</button>
              <h3 className="cal-month-label">{MONTHS[month-1]} {year}</h3>
              <button className="cal-nav-btn" onClick={nextMonth}>›</button>
            </div>

            <div className="cal-grid-header">
              {DAYS.map(d => <div key={d} className="cal-day-name">{d}</div>)}
            </div>

            <div className="cal-grid">
              {loading ? (
                <div className="cal-loading"><div className="drama-spinner">📅</div><p>Loading your fate…</p></div>
              ) : (
                cells.map((day, idx) => {
                  if (!day) return <div key={`empty-${idx}`} className="cal-cell cal-empty" />;
                  const dateStr = `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                  const tasks   = data.grouped[dateStr] || [];
                  const isToday = dateStr === todayStr;
                  const isSel   = dateStr === selected;
                  const maxDrama = tasks.length ? Math.max(...tasks.map(t=>t.dramaLevel)) : 0;
                  return (
                    <div
                      key={dateStr}
                      className={`cal-cell ${isToday?"cal-today":""} ${isSel?"cal-selected":""} ${tasks.length?"cal-has-tasks":""}`}
                      style={tasks.length ? { "--cell-color": getDramaColor(maxDrama) } : {}}
                      onClick={() => setSelected(isSel ? null : dateStr)}
                    >
                      <span className="cal-day-num">{day}</span>
                      {tasks.length > 0 && (
                        <div className="cal-dots">
                          {tasks.slice(0,3).map((t,i) => (
                            <span key={i} className="cal-dot" style={{ background: getDramaColor(t.dramaLevel) }} />
                          ))}
                          {tasks.length > 3 && <span className="cal-dot-plus">+{tasks.length-3}</span>}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Summary */}
            <div className="cal-summary">
              <span>{data.tasks?.length || 0} tasks this month</span>
              {data.tasks?.length > 0 && (
                <span>Avg drama: {(data.tasks.reduce((s,t)=>s+t.dramaLevel,0)/data.tasks.length).toFixed(1)}/10</span>
              )}
            </div>
          </div>

          {/* Task list panel for selected day */}
          <div className="cal-detail">
            {selected ? (
              <>
                <h3 className="cal-detail-title">
                  📅 {new Date(selected + "T12:00:00").toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" })}
                </h3>
                {selectedTasks.length === 0 ? (
                  <div className="cal-detail-empty">
                    <span>😌</span>
                    <p>No crises on this day.<br/>Rare moment of peace.</p>
                  </div>
                ) : (
                  <div className="cal-detail-tasks">
                    {selectedTasks.map(t => (
                      <div key={t._id} className={`cal-task-card ${t.completed?"done":""}`}>
                        <div className="ctc-left">
                          <span className="ctc-check">{t.completed ? "✓" : "○"}</span>
                          <div>
                            <p className={`ctc-title ${t.completed?"ctc-done":""}`}>{t.title}</p>
                            {t.category && <span className="ctc-cat">{t.category.icon} {t.category.name}</span>}
                          </div>
                        </div>
                        <span className="ctc-drama" style={{ color: getDramaColor(t.dramaLevel) }}>
                          {t.dramaLevel}/10
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="cal-detail-empty">
                <span>📅</span>
                <p>Click a day to see<br/>its scheduled catastrophes.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
