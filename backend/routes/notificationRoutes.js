const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const protect = require("../middleware/authMiddleware");

router.get("/", protect, async (req, res) => {
  try {
    const notifs = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifs);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put("/read-all", protect, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ message: "All read" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete("/", protect, async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    res.json({ message: "Cleared" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
