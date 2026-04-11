const express = require("express");
const router = express.Router();
const Category = require("../models/Category");
const protect = require("../middleware/authMiddleware");

// GET ALL CATEGORIES
router.get("/", protect, async (req, res) => {
  try {
    const categories = await Category.find({ user: req.user._id });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE CATEGORY
router.post("/", protect, async (req, res) => {
  try {
    const { name, icon, color } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    const category = await Category.create({
      name,
      icon: icon || "🎭",
      color: color || "#8b5cf6",
      user: req.user._id,
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE CATEGORY
router.put("/:id", protect, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });
    if (category.user.toString() !== req.user._id.toString())
      return res.status(401).json({ message: "Not authorized" });

    category.name = req.body.name || category.name;
    category.icon = req.body.icon || category.icon;
    category.color = req.body.color || category.color;

    const updated = await category.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE CATEGORY
router.delete("/:id", protect, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });
    if (category.user.toString() !== req.user._id.toString())
      return res.status(401).json({ message: "Not authorized" });

    await category.deleteOne();
    res.json({ message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
