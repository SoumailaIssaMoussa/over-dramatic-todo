const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const User = require("../models/User");
const Notification = require("../models/Notification");
const protect = require("../middleware/authMiddleware");

// Drama level labels helper
const getDramaLabel = (level) => {
  if (level <= 2) return "Mildly Inconvenient";
  if (level <= 4) return "Somewhat Annoying";
  if (level <= 6) return "Emotionally Devastating";
  if (level <= 8) return "EXISTENTIAL CRISIS";
  return "END OF THE WORLD";
};

// Helper: update user mood and badges after task changes
const recomputeUserMood = async (userId) => {
  try {
    const tasks = await Task.find({ user: userId });
    if (!tasks.length) return;
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const catastrophic = tasks.filter((t) => t.dramaLevel >= 8).length;
    const avgDrama = (tasks.reduce((s, t) => s + t.dramaLevel, 0) / total);
    const user = await User.findById(userId);
    if (user) {
      await user.recomputeMood(avgDrama);
      await user.checkBadges({ total, completed, catastrophic, avgDrama });
    }
  } catch (err) { console.error("recomputeUserMood error:", err.message); }
};

// CREATE TASK
router.post("/", protect, async (req, res) => {
  try {
    const { title, description, dramaLevel, category, dueDate, attachment, isRecurring, recurrence, priority } = req.body;

    // ── Validation ──────────────────────────────────────────────────────────
    if (!title || !title.trim()) return res.status(400).json({ message: "Task title is required." });
    if (title.trim().length > 200) return res.status(400).json({ message: "Title too long (max 200 characters)." });
    if (dramaLevel !== undefined && (dramaLevel < 1 || dramaLevel > 10))
      return res.status(400).json({ message: "Drama level must be between 1 and 10." });
    if (dueDate && isNaN(Date.parse(dueDate)))
      return res.status(400).json({ message: "Invalid due date format." });
    if (isRecurring && recurrence?.interval && !["daily","weekly","monthly"].includes(recurrence.interval))
      return res.status(400).json({ message: "Recurrence interval must be daily, weekly, or monthly." });
    // ────────────────────────────────────────────────────────────────────────

    const task = await Task.create({
      user: req.user._id,
      title,
      description: description || "",
      dramaLevel: dramaLevel || 5,
      category: category || null,
      dueDate: dueDate || null,
      attachment: attachment || {},
      isRecurring: isRecurring || false,
      recurrence: recurrence || {},
      priority: priority || "medium",
      dramaHistory: [{ date: new Date(), dramaLevel: dramaLevel || 5, event: "created" }],
    });

    await Notification.create({
      user: req.user._id,
      message: `A new crisis has emerged: "${title}" — Drama Level: ${getDramaLabel(task.dramaLevel)}${task.isRecurring ? " (RECURRING — it shall return!)" : ""}`,
      type: task.dramaLevel >= 8 ? "catastrophe" : task.dramaLevel >= 5 ? "warning" : "info",
      task: task._id,
    });

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalTasksCreated: 1 } });
    await recomputeUserMood(req.user._id);

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET ALL TASKS (with filtering & sorting)
router.get("/", protect, async (req, res) => {
  try {
    const { filter, sort, search, category, priority } = req.query;
    let query = { user: req.user._id };

    if (filter === "active") query.completed = false;
    if (filter === "completed") query.completed = true;
    if (filter === "catastrophic") query.dramaLevel = { $gte: 8 };
    if (filter === "recurring") query.isRecurring = true;
    if (filter === "overdue") {
      query.completed = false;
      query.dueDate = { $lt: new Date() };
    }
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (search) query.title = { $regex: search, $options: "i" };

    let sortObj = { createdAt: -1 };
    if (sort === "drama") sortObj = { dramaLevel: -1 };
    if (sort === "title") sortObj = { title: 1 };
    if (sort === "dueDate") sortObj = { dueDate: 1 };
    if (sort === "priority") sortObj = { priority: -1 };

    // Auto-escalate overdue recurring tasks
    const overdueTasks = await Task.find({
      user: req.user._id,
      isRecurring: true,
      completed: false,
      dueDate: { $lt: new Date() },
    });
    for (const t of overdueTasks) await t.checkEscalation();

    const tasks = await Task.find(query).sort(sortObj).populate("category", "name icon color");
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET CALENDAR VIEW — tasks grouped by due date
router.get("/calendar", protect, async (req, res) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const targetMonth = month ? parseInt(month) - 1 : now.getMonth();
    const targetYear = year ? parseInt(year) : now.getFullYear();

    const startOfMonth = new Date(targetYear, targetMonth, 1);
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

    const tasks = await Task.find({
      user: req.user._id,
      dueDate: { $gte: startOfMonth, $lte: endOfMonth },
    }).populate("category", "name icon color").sort({ dueDate: 1 });

    // Group by date string
    const grouped = {};
    tasks.forEach((t) => {
      const key = new Date(t.dueDate).toISOString().split("T")[0];
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(t);
    });

    res.json({ grouped, tasks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET DRAMA HISTORY — analytics over time
router.get("/analytics/drama-trend", protect, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const tasks = await Task.find({ user: req.user._id });
    const recentTasks = tasks.filter(t => t.createdAt >= since);

    // --- Drama change over time from dramaHistory ---
    const dramaByDay = {};
    tasks.forEach((t) => {
      (t.dramaHistory || []).forEach((h) => {
        if (new Date(h.date) < since) return;
        const day = new Date(h.date).toISOString().split("T")[0];
        if (!dramaByDay[day]) dramaByDay[day] = { sum: 0, count: 0 };
        dramaByDay[day].sum += h.dramaLevel;
        dramaByDay[day].count++;
      });
    });
    const trend = Object.entries(dramaByDay)
      .map(([date, d]) => ({ date, avgDrama: +(d.sum / d.count).toFixed(1), count: d.count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // --- Completion trend by day ---
    const completionByDay = {};
    tasks.forEach((t) => {
      if (!t.completedAt || new Date(t.completedAt) < since) return;
      const day = new Date(t.completedAt).toISOString().split("T")[0];
      completionByDay[day] = (completionByDay[day] || 0) + 1;
    });
    const completionTrend = Object.entries(completionByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // --- Created task trend by day ---
    const createdByDay = {};
    recentTasks.forEach((t) => {
      const day = t.createdAt.toISOString().split("T")[0];
      createdByDay[day] = (createdByDay[day] || 0) + 1;
    });
    const createdTrend = Object.entries(createdByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // --- Overdue trend (tasks that became overdue in this window) ---
    const overdueCount = tasks.filter(
      (t) => !t.completed && t.dueDate && new Date(t.dueDate) < new Date() && new Date(t.dueDate) >= since
    ).length;

    // --- Escalation count from dramaHistory ---
    let escalationCount = 0;
    tasks.forEach((t) => {
      (t.dramaHistory || []).forEach((h) => {
        if (h.event === "escalated" && new Date(h.date) >= since) escalationCount++;
      });
    });

    // --- Drama level distribution across all tasks ---
    const levelDist = [0, 0, 0, 0, 0]; // buckets: 1-2, 3-4, 5-6, 7-8, 9-10
    tasks.forEach((t) => {
      const i = Math.min(4, Math.floor((t.dramaLevel - 1) / 2));
      levelDist[i]++;
    });

    res.json({
      trend,
      completionTrend,
      createdTrend,
      overdueCount,
      escalationCount,
      levelDist,
      levelLabels: ["1-2", "3-4", "5-6", "7-8", "9-10"],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET TASK STATS
router.get("/stats/summary", protect, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id });
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const catastrophic = tasks.filter((t) => t.dramaLevel >= 8).length;
    const recurring = tasks.filter((t) => t.isRecurring).length;
    const overdue = tasks.filter((t) => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length;
    const avgDrama = total > 0 ? (tasks.reduce((s, t) => s + t.dramaLevel, 0) / total).toFixed(1) : 0;

    const user = await User.findById(req.user._id);

    // Meltdown meter: weighted score from overdue + recurring overdue + avg drama
    const overdueRecurring = tasks.filter(t => t.isRecurring && !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length;
    const meltdownScore = Math.min(100, Math.round(
      (overdue * 10) + (overdueRecurring * 15) + (catastrophic * 8) + (parseFloat(avgDrama) * 3)
    ));
    const meltdownLabel =
      meltdownScore >= 80 ? "🔥 TOTAL MELTDOWN" :
      meltdownScore >= 60 ? "😱 CRITICAL CHAOS" :
      meltdownScore >= 40 ? "😰 HIGH TENSION" :
      meltdownScore >= 20 ? "😤 BUILDING DRAMA" : "😌 Suspiciously Calm";

    res.json({ total, completed, active: total - completed, catastrophic, recurring, overdue, avgDrama, dramaMood: user?.dramaMood, moodOverride: user?.moodOverride || false, badges: user?.badges || [], meltdownScore, meltdownLabel });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET SINGLE TASK
router.get("/:id", protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate("category", "name icon color");
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (task.user.toString() !== req.user._id.toString())
      return res.status(401).json({ message: "Not authorized" });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE TASK
router.put("/:id", protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (task.user.toString() !== req.user._id.toString())
      return res.status(401).json({ message: "Not authorized" });

    const wasCompleted = task.completed;
    const oldDramaLevel = task.dramaLevel;

    task.title = req.body.title !== undefined ? req.body.title : task.title;
    task.description = req.body.description !== undefined ? req.body.description : task.description;
    task.dramaLevel = req.body.dramaLevel !== undefined ? req.body.dramaLevel : task.dramaLevel;
    task.completed = req.body.completed !== undefined ? req.body.completed : task.completed;
    task.category = req.body.category !== undefined ? req.body.category : task.category;
    task.dueDate = req.body.dueDate !== undefined ? req.body.dueDate : task.dueDate;
    task.priority = req.body.priority !== undefined ? req.body.priority : task.priority;
    if (req.body.attachment !== undefined) task.attachment = req.body.attachment;
    if (req.body.isRecurring !== undefined) task.isRecurring = req.body.isRecurring;
    if (req.body.recurrence !== undefined) task.recurrence = req.body.recurrence;

    // Track drama level changes
    if (req.body.dramaLevel !== undefined && req.body.dramaLevel !== oldDramaLevel) {
      task.dramaHistory.push({ date: new Date(), dramaLevel: task.dramaLevel, event: "updated" });
    }

    // Mark completion time
    if (!wasCompleted && task.completed) {
      task.completedAt = new Date();
      task.dramaHistory.push({ date: new Date(), dramaLevel: task.dramaLevel, event: "completed" });
    }
    if (wasCompleted && !task.completed) {
      task.completedAt = null;
    }

    const updatedTask = await task.save();

    if (!wasCompleted && updatedTask.completed) {
      await Notification.create({
        user: req.user._id,
        message: `MIRACLE! You have survived "${updatedTask.title}"! The world may yet be saved.`,
        type: "success",
        task: updatedTask._id,
      });
      await User.findByIdAndUpdate(req.user._id, { $inc: { totalTasksCompleted: 1 } });

      // Handle recurring: if recurring and completed, reset and update due date
      if (updatedTask.isRecurring) {
        const newTask = new Task({
          user: req.user._id,
          title: updatedTask.title,
          description: updatedTask.description,
          dramaLevel: updatedTask.dramaLevel,
          category: updatedTask.category,
          isRecurring: true,
          recurrence: {
            ...updatedTask.recurrence,
            timesRecurred: (updatedTask.recurrence.timesRecurred || 0) + 1,
          },
          priority: updatedTask.priority,
          dramaHistory: [{ date: new Date(), dramaLevel: updatedTask.dramaLevel, event: "created" }],
          dueDate: getNextDueDate(updatedTask.dueDate, updatedTask.recurrence.interval),
          completed: false,
        });
        await newTask.save();
        await Notification.create({
          user: req.user._id,
          message: `🔄 The recurring crisis "${updatedTask.title}" has been reborn! It shall return...`,
          type: "warning",
        });
      }
    }

    await recomputeUserMood(req.user._id);
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

function getNextDueDate(currentDue, interval) {
  const d = currentDue ? new Date(currentDue) : new Date();
  if (interval === "daily") d.setDate(d.getDate() + 1);
  else if (interval === "weekly") d.setDate(d.getDate() + 7);
  else if (interval === "monthly") d.setMonth(d.getMonth() + 1);
  return d;
}

// DELETE TASK
router.delete("/:id", protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (task.user.toString() !== req.user._id.toString())
      return res.status(401).json({ message: "Not authorized" });

    // Delete attached file from disk if exists
    if (task.attachment?.filename) {
      const fs = require("fs");
      const path = require("path");
      const filePath = path.join(__dirname, "../uploads", task.attachment.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await task.deleteOne();

    await Notification.create({
      user: req.user._id,
      message: `"${task.title}" has been dramatically OBLITERATED from existence.`,
      type: "warning",
    });

    // If this was the last task, reset mood to calm/neutral
    const remaining = await Task.countDocuments({ user: req.user._id });
    if (remaining === 0) {
      await User.findByIdAndUpdate(req.user._id, { dramaMood: "calm" });
    } else {
      await recomputeUserMood(req.user._id);
    }
    res.json({ message: "Task dramatically destroyed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
