const mongoose = require("mongoose");

const uploadSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    storedFilename: { type: String, required: true },   // name on disk
    originalName:   { type: String, required: true },   // user's original filename
    mimetype:       { type: String, required: true },
    size:           { type: Number, required: true },   // bytes
  },
  { timestamps: true }
);

module.exports = mongoose.model("Upload", uploadSchema);
