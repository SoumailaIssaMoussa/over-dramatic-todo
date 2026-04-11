const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const User = require("../models/User");
const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, signature } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });
    if (password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail))
      return res.status(400).json({ message: "Invalid email address." });
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) return res.status(400).json({ message: "User already exists" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name: name.trim(), email: normalizedEmail, password: hashedPassword, signature: signature || "" });
    res.status(201).json({
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, dramaMood: user.dramaMood, moodOverride: user.moodOverride, badges: user.badges, avatar: user.avatar },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });
    res.json({
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, dramaMood: user.dramaMood, badges: user.badges, avatar: user.avatar },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── GOOGLE OAUTH ─────────────────────────────────────────────────────────────

// Step 1: Redirect to Google
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Step 2: Google callback
router.get("/auth/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, user, info) => {
    if (err) {
      console.error("Google callback error:", err);
      return res.redirect(
        `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=oauth_failed`
      );
    }

    if (!user) {
      console.error("Google callback failed: no user returned", info);
      return res.redirect(
        `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=oauth_failed`
      );
    }

    try {
      const token = generateToken(user._id);

      const safeUser = encodeURIComponent(
        JSON.stringify({
          id: user._id,
          name: user.name,
          email: user.email,
          dramaMood: user.dramaMood,
          badges: user.badges,
          avatar: user.avatar,
        })
      );

      const redirectUrl = `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/auth/callback?token=${token}&user=${safeUser}`;

      console.log("Google OAuth success redirect:", redirectUrl);

      return res.redirect(redirectUrl);
    } catch (error) {
      console.error("Post-auth redirect error:", error);
      return res.redirect(
        `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=oauth_failed`
      );
    }
  })(req, res, next);
});

// ─── PROFILE ─────────────────────────────────────────────────────────────────

router.get("/profile", protect, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.json(user);
});

router.put("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Validate name
    if (req.body.name !== undefined) {
      if (!req.body.name.trim()) return res.status(400).json({ message: "Name cannot be empty." });
      user.name = req.body.name.trim();
    }

    // Check email uniqueness if email is being changed
    if (req.body.email !== undefined && req.body.email !== user.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(req.body.email)) return res.status(400).json({ message: "Invalid email address." });
      const existing = await User.findOne({ email: req.body.email });
      if (existing) return res.status(400).json({ message: "That email is already in use by another account." });
      user.email = req.body.email;
    }

    if (req.body.dramaMood !== undefined) user.dramaMood = req.body.dramaMood;
    if (req.body.signature !== undefined) user.signature = req.body.signature.slice(0, 200); // cap length

    const updated = await user.save();
    res.json({ id: updated._id, name: updated.name, email: updated.email, dramaMood: updated.dramaMood, badges: updated.badges, avatar: updated.avatar, signature: updated.signature });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload avatar — stored like any other upload, served through /api/upload
router.post("/avatar", protect, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded." });
    const Upload = require("../models/Upload");
    const record = await Upload.create({
      owner:          req.user._id,
      storedFilename: req.file.filename,
      originalName:   req.file.originalname,
      mimetype:       req.file.mimetype,
      size:           req.file.size,
    });
    const baseUrl = process.env.BACKEND_URL || "http://localhost:5000";
    const avatarUrl = `${baseUrl}/api/upload/${req.file.filename}`;
    await User.findByIdAndUpdate(req.user._id, { avatar: avatarUrl });
    res.json({ avatar: avatarUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/mood-override — enable/disable manual mood override
router.put("/mood-override", protect, async (req, res) => {
  try {
    const { moodOverride, dramaMood } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.moodOverride = !!moodOverride;
    if (moodOverride && dramaMood) user.dramaMood = dramaMood; // apply manual mood
    await user.save();
    res.json({ moodOverride: user.moodOverride, dramaMood: user.dramaMood });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/change-password", protect, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    // Google OAuth users may not have a password set
    if (user.googleId && (!user.password || user.password.length < 10)) {
      return res.status(400).json({ message: "Your account uses Google sign-in. Password login is not enabled — you cannot set a password here." });
    }

    if (!oldPassword || !newPassword)
      return res.status(400).json({ message: "Both old and new passwords are required." });
    if (newPassword.length < 6)
      return res.status(400).json({ message: "New password must be at least 6 characters." });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Old password is incorrect." });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Password updated successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
