const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    dramaLevel: { type: Number, min: 1, max: 10, default: 5 },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    attachment: {
      filename: { type: String, default: null },     // saved filename on disk
      originalName: { type: String, default: null }, // original upload name
      mimetype: { type: String, default: null },
      size: { type: Number, default: null },
      url: { type: String, default: null },          // full URL to download
    },
    dueDate: { type: Date, default: null },

    // Recurring task support
    isRecurring: { type: Boolean, default: false },
    recurrence: {
      interval: { type: String, enum: ["daily", "weekly", "monthly"], default: "weekly" },
      escalateOnMiss: { type: Boolean, default: true },  // drama goes up if missed
      timesRecurred: { type: Number, default: 0 },
    },

    // Drama escalation history — each entry is { date, dramaLevel }
    dramaHistory: [
      {
        date: { type: Date, default: Date.now },
        dramaLevel: { type: Number },
        event: { type: String },  // 'created', 'escalated', 'completed', 'updated'
      },
    ],

    // Priority tag
    priority: { type: String, enum: ["low", "medium", "high", "apocalyptic"], default: "medium" },

    // Time-based escalation guard — escalate at most once per calendar day
    lastEscalatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Auto-escalate drama for overdue recurring tasks — throttled by recurrence interval
taskSchema.methods.checkEscalation = async function () {
  if (
    !this.isRecurring ||
    !this.recurrence.escalateOnMiss ||
    this.completed ||
    !this.dueDate ||
    new Date(this.dueDate) >= new Date() ||
    this.dramaLevel >= 10
  ) return;

  const now = new Date();
  if (this.lastEscalatedAt) {
    const last       = new Date(this.lastEscalatedAt);
    const interval   = this.recurrence?.interval || "daily";
    const msElapsed  = now - last;

    // Escalate at most once per recurrence interval
    const minGapMs = {
      daily:   24 * 60 * 60 * 1000,          // 1 day
      weekly:  7  * 24 * 60 * 60 * 1000,     // 1 week
      monthly: 30 * 24 * 60 * 60 * 1000,     // ~1 month
    }[interval] ?? 24 * 60 * 60 * 1000;

    if (msElapsed < minGapMs) return;
  }

  this.dramaLevel = Math.min(10, this.dramaLevel + 1);
  this.lastEscalatedAt = now;
  this.dramaHistory.push({ date: now, dramaLevel: this.dramaLevel, event: "escalated" });
  await this.save();
};

module.exports = mongoose.model("Task", taskSchema);
