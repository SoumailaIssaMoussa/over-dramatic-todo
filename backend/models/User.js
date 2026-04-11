const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: null },
    googleId: { type: String, default: null },
    dramaMood: {
      type: String,
      enum: ["calm", "tense", "dramatic", "catastrophic"],
      default: "dramatic",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
