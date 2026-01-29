const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

// Charger les variables d'environnement
dotenv.config();

// Connexion MongoDB
connectDB();

const app = express();

// 🔥 CORS (TRÈS IMPORTANT)
app.use(cors({
  origin: "http://localhost:5173"
}));

// Middleware JSON
app.use(express.json());

// Routes
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");

app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);

// Route test
app.get("/", (req, res) => {
  res.send("Backend + MongoDB running correctly 🚀");
});

// Lancer le serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
