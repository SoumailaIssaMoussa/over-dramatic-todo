import "./DramaSlider.css";

const LABELS = [
  "", // 0 unused
  "😐 Mildly Inconvenient",
  "😒 Somewhat Bothersome",
  "😤 Legitimately Annoying",
  "😣 Deeply Troubling",
  "😭 Emotionally Devastating",
  "😰 Spiritually Draining",
  "😱 An Existential Crisis",
  "🤯 Reality-Shattering",
  "💀 Civilization-Ending",
  "☠️ END OF THE WORLD",
];

const COLORS = [
  "", "#10b981", "#10b981",
  "#3b82f6", "#3b82f6",
  "#f59e0b", "#f59e0b",
  "#ef4444", "#ef4444",
  "#a855f7", "#a855f7",
];

export default function DramaSlider({ value, onChange }) {
  return (
    <div className="drama-slider-wrap">
      <div className="drama-slider-header">
        <span className="drama-slider-label">Drama Level: {value}/10</span>
        <span className="drama-current-label" style={{ color: COLORS[value] }}>
          {LABELS[value]}
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="drama-range"
        style={{ "--thumb-color": COLORS[value] }}
      />
      <div className="drama-ticks">
        {[1,2,3,4,5,6,7,8,9,10].map((n) => (
          <span key={n} className={`drama-tick ${value === n ? "active" : ""}`}
            style={{ color: value >= n ? COLORS[n] : "var(--text-dim)" }}>
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}
