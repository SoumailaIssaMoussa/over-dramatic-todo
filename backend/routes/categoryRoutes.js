const express = require("express");
const router = express.Router();
const Category = require("../models/Category");
const protect = require("../middleware/authMiddleware");

// GET ALL
router.get("/", protect, async (req, res) => {
  try {
    const categories = await Category.find({ user: req.user._id });
    res.json(categories);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// CREATE — enforce uniqueness per user
router.post("/", protect, async (req, res) => {
  try {
    const { name, icon, color } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: "Category name is required." });
    const trimmed = name.trim();
    // Uniqueness check per user (case-insensitive)
    const exists = await Category.findOne({ user: req.user._id, name: { $regex: `^${trimmed}$`, $options: "i" } });
    if (exists) return res.status(400).json({ message: `Category "${trimmed}" already exists.` });
    const category = await Category.create({ name: trimmed, icon: icon || "🎭", color: color || "#8b5cf6", user: req.user._id });
    res.status(201).json(category);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// UPDATE
router.put("/:id", protect, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });
    if (category.user.toString() !== req.user._id.toString())
      return res.status(401).json({ message: "Not authorized" });
    // Uniqueness check on rename
    if (req.body.name && req.body.name.trim() !== category.name) {
      const exists = await Category.findOne({ user: req.user._id, name: { $regex: `^${req.body.name.trim()}$`, $options: "i" }, _id: { $ne: category._id } });
      if (exists) return res.status(400).json({ message: `Category "${req.body.name.trim()}" already exists.` });
      category.name = req.body.name.trim();
    }
    if (req.body.icon) category.icon = req.body.icon;
    if (req.body.color) category.color = req.body.color;
    const updated = await category.save();
    res.json(updated);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// DELETE
router.delete("/:id", protect, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });
    if (category.user.toString() !== req.user._id.toString())
      return res.status(401).json({ message: "Not authorized" });
    await category.deleteOne();
    res.json({ message: "Category deleted" });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;
