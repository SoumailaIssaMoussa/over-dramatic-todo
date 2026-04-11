const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
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

// CREATE TASK
router.post("/", protect, async (req, res) => {
  try {
    const { title, description, dramaLevel, category, dueDate, attachment } = req.body;

    const task = await Task.create({
      user: req.user._id,
      title,
      description: description || "",
      dramaLevel: dramaLevel || 5,
      category: category || null,
      dueDate: dueDate || null,
      attachment: attachment || {},
    });

    // Create a dramatic notification
    await Notification.create({
      user: req.user._id,
      message: `A new crisis has emerged: "${title}" — Drama Level: ${getDramaLabel(task.dramaLevel)}`,
      type: task.dramaLevel >= 8 ? "catastrophe" : task.dramaLevel >= 5 ? "warning" : "info",
      task: task._id,
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET ALL TASKS (with filtering & sorting)
router.get("/", protect, async (req, res) => {
  try {
    const { filter, sort, search, category } = req.query;
    let query = { user: req.user._id };

    if (filter === "active") query.completed = false;
    if (filter === "completed") query.completed = true;
    if (filter === "catastrophic") query.dramaLevel = { $gte: 8 };
    if (category) query.category = category;
    if (search) query.title = { $regex: search, $options: "i" };

    let sortObj = { createdAt: -1 };
    if (sort === "drama") sortObj = { dramaLevel: -1 };
    if (sort === "title") sortObj = { title: 1 };
    if (sort === "dueDate") sortObj = { dueDate: 1 };

    const tasks = await Task.find(query).sort(sortObj).populate("category", "name icon color");
    res.json(tasks);
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

    task.title = req.body.title !== undefined ? req.body.title : task.title;
    task.description = req.body.description !== undefined ? req.body.description : task.description;
    task.dramaLevel = req.body.dramaLevel !== undefined ? req.body.dramaLevel : task.dramaLevel;
    task.completed = req.body.completed !== undefined ? req.body.completed : task.completed;
    task.category = req.body.category !== undefined ? req.body.category : task.category;
    task.dueDate = req.body.dueDate !== undefined ? req.body.dueDate : task.dueDate;
    if (req.body.attachment !== undefined) task.attachment = req.body.attachment;

    const updatedTask = await task.save();

    // Notification on completion
    if (!wasCompleted && updatedTask.completed) {
      await Notification.create({
        user: req.user._id,
        message: `MIRACLE! You have survived "${updatedTask.title}"! The world may yet be saved.`,
        type: "success",
        task: updatedTask._id,
      });
    }

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE TASK
router.delete("/:id", protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (task.user.toString() !== req.user._id.toString())
      return res.status(401).json({ message: "Not authorized" });

    await task.deleteOne();

    await Notification.create({
      user: req.user._id,
      message: `"${task.title}" has been dramatically OBLITERATED from existence.`,
      type: "warning",
    });

    res.json({ message: "Task dramatically destroyed" });
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
    const avgDrama = total > 0 ? (tasks.reduce((s, t) => s + t.dramaLevel, 0) / total).toFixed(1) : 0;

    res.json({ total, completed, active: total - completed, catastrophic, avgDrama });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
