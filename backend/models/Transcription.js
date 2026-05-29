const mongoose = require("mongoose");

const transcriptionSchema = new mongoose.Schema({
  filename: String,
  transcription: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Transcription", transcriptionSchema);
