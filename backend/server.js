const express = require("express");
const multer = require("multer");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

/* Middleware */
app.use(cors());
app.use(express.json());

/* MongoDB Connection */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

/* Multer Storage Setup */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

/* MongoDB Schema */
const transcriptionSchema = new mongoose.Schema({
  filename: String,
  transcription: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

/* MongoDB Model */
const Transcription = mongoose.model(
  "Transcription",
  transcriptionSchema
);

/* Test Route */
app.get("/", (req, res) => {
  res.send("Backend is running");
});

/* Upload Route */
app.post("/upload", upload.single("audio"), async (req, res) => {
  try {
    const newTranscription = new Transcription({
      filename: req.file.filename,
      transcription: "Sample transcription",
    });

    await newTranscription.save();

    res.json({
      message: "File uploaded and saved successfully",
      data: newTranscription,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Error uploading file",
    });
  }
});

/* Start Server */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});