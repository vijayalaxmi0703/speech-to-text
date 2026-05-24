const express = require("express");
const multer = require("multer");
const cors = require("cors");
const mongoose = require("mongoose");
const fs = require("fs");
const { Deepgram } = require("@deepgram/sdk");
require("dotenv").config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

/* MongoDB Connection */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

/* Schema */
const transcriptionSchema = new mongoose.Schema({
  filename: String,
  transcription: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Transcription = mongoose.model(
  "Transcription",
  transcriptionSchema
);

/* Multer Setup */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

/* Deepgram */
const deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY);
/* Test Route */
app.get("/", (req, res) => {
  res.send("Backend is running");
});

/* Upload Route */
app.post("/upload", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No audio file uploaded",
      });
    }

    const audioBuffer = fs.readFileSync(req.file.path);

    const response = await deepgram.transcription.preRecorded(
  {
    buffer: audioBuffer,
    mimetype: "audio/mp3",
  },
  {
    punctuate: true,
    model: "nova",
  }
  );

    const transcription =
     response.results.channels[0].alternatives[0].transcript;

    const newTranscription = new Transcription({
      filename: req.file.filename,
      transcription,
    });

    await newTranscription.save();

    res.json({
      message: "Transcription successful",
      transcription,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Error generating transcription",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});