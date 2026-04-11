const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

const cors = require("cors");
const path = require("path");
const passport = require("passport");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
require("./config/passport");

connectDB();

const app = express();

// Rate limiter for API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: "Too many requests — even drama has limits." },
});

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(passport.initialize());
app.use("/api", apiLimiter);

// NOTE: /uploads is NOT served statically.
// All file access goes through /api/upload/:filename (authenticated, owner-only).

// Routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));

app.get("/", (req, res) => {
  res.send("Over-Dramatic To-Do Backend is LIVE and SUFFERING 🎭");
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT} — The drama begins...`);
});