const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: null },      // URL to avatar (Google or uploaded)
    googleId: { type: String, default: null },
    dramaMood: {
      type: String,
      enum: ["calm", "tense", "dramatic", "catastrophic"],
      default: "dramatic",
    },
    // Computed/tracked stats
    totalTasksCreated: { type: Number, default: 0 },
    totalTasksCompleted: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },  // days in a row completing tasks
    currentStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: null },
    // Badges earned
    badges: [{ type: String }],
    // User bio/signature
    signature: { type: String, default: "" },   // dramatic personal motto

    // Mood override: when true, manual dramaMood is preserved even after task changes
    moodOverride: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto-compute dramaMood based on recent tasks — skipped when moodOverride is true
userSchema.methods.recomputeMood = async function (avgDrama) {
  if (this.moodOverride) return; // manual override — leave mood alone
  if (avgDrama <= 3) this.dramaMood = "calm";
  else if (avgDrama <= 5) this.dramaMood = "tense";
  else if (avgDrama <= 7.5) this.dramaMood = "dramatic";
  else this.dramaMood = "catastrophic";
  await this.save();
};

// Award badges
userSchema.methods.checkBadges = async function (stats) {
  const earned = new Set(this.badges);
  if (stats.total >= 1 && !earned.has("first_crisis")) earned.add("first_crisis");
  if (stats.completed >= 1 && !earned.has("first_survivor")) earned.add("first_survivor");
  if (stats.completed >= 10 && !earned.has("drama_veteran")) earned.add("drama_veteran");
  if (stats.catastrophic >= 3 && !earned.has("chaos_magnet")) earned.add("chaos_magnet");
  if (stats.total >= 50 && !earned.has("crisis_collector")) earned.add("crisis_collector");
  if (stats.avgDrama >= 8 && !earned.has("agent_of_chaos")) earned.add("agent_of_chaos");
  this.badges = [...earned];
  await this.save();
};

module.exports = mongoose.model("User", userSchema);
