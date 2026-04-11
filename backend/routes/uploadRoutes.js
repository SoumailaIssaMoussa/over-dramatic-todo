const express = require("express");
const router  = express.Router();
const path    = require("path");
const fs      = require("fs");
const upload  = require("../middleware/upload");
const protect = require("../middleware/authMiddleware");
const Upload  = require("../models/Upload");

const UPLOAD_DIR = path.join(__dirname, "../uploads");

// POST /api/upload — upload a file, record it in DB
router.post("/", protect, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded." });
  try {
    const record = await Upload.create({
      owner:          req.user._id,
      storedFilename: req.file.filename,
      originalName:   req.file.originalname,
      mimetype:       req.file.mimetype,
      size:           req.file.size,
    });

    const baseUrl = process.env.BACKEND_URL || "http://localhost:5000";
    res.json({
      fileId:       record._id,
      filename:     record.storedFilename,
      originalName: record.originalName,
      mimetype:     record.mimetype,
      size:         record.size,
      url: `${baseUrl}/api/upload/${record.storedFilename}`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/upload/:filename — serve file (owner only, authenticated)
router.get("/:filename", protect, async (req, res) => {
  const { filename } = req.params;
  const record = await Upload.findOne({ storedFilename: filename });
  if (!record) return res.status(404).json({ message: "File not found." });
  if (record.owner.toString() !== req.user._id.toString())
    return res.status(403).json({ message: "Forbidden — not your file." });
  const filePath = path.join(UPLOAD_DIR, filename);
  if (!fs.existsSync(filePath))
    return res.status(404).json({ message: "File missing from storage." });
  res.sendFile(filePath);
});

// DELETE /api/upload/:filename — delete file + DB record (owner only)
router.delete("/:filename", protect, async (req, res) => {
  const { filename } = req.params;
  const record = await Upload.findOne({ storedFilename: filename });
  if (!record) return res.status(404).json({ message: "File not found." });
  if (record.owner.toString() !== req.user._id.toString())
    return res.status(403).json({ message: "Forbidden — not your file." });
  const filePath = path.join(UPLOAD_DIR, filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  await record.deleteOne();
  res.json({ message: "File dramatically deleted from existence." });
});

module.exports = router;
