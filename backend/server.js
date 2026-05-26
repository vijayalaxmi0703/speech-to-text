const express = require("express");
const multer = require("multer");
const cors = require("cors");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { Deepgram } = require("@deepgram/sdk");

require("dotenv").config();

const app = express();
const PORT = 5000;

/* ────────────────────────────────────────────────────────── */
/* Middleware */
/* ────────────────────────────────────────────────────────── */

app.use(cors());
app.use(express.json());

/* ────────────────────────────────────────────────────────── */
/* MongoDB Connection */
/* ────────────────────────────────────────────────────────── */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

/* ────────────────────────────────────────────────────────── */
/* Schema */
/* ────────────────────────────────────────────────────────── */

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

/* ────────────────────────────────────────────────────────── */
/* Create uploads folder if not exists */
/* ────────────────────────────────────────────────────────── */

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

/* ────────────────────────────────────────────────────────── */
/* Multer Setup */
/* ────────────────────────────────────────────────────────── */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage,

  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("audio/")) {
      cb(null, true);
    } else {
      cb(new Error("Only audio files are allowed"));
    }
  },
});

/* ────────────────────────────────────────────────────────── */
/* Deepgram Setup */
/* ────────────────────────────────────────────────────────── */

const deepgram = new Deepgram(
  process.env.DEEPGRAM_API_KEY
);

/* ────────────────────────────────────────────────────────── */
/* Test Route */
/* ────────────────────────────────────────────────────────── */

app.get("/", (req, res) => {
  res.json({
    message: "Backend Connected Successfully",
  });
});

/* ────────────────────────────────────────────────────────── */
/* Upload Route */
/* ────────────────────────────────────────────────────────── */

app.post(
  "/upload",
  upload.single("audio"),
  async (req, res) => {
    try {
      /* Check file */

      if (!req.file) {
        return res.status(400).json({
          message: "No audio file uploaded",
        });
      }

      console.log("Uploaded File:");
      console.log(req.file);

      /* Read uploaded audio */

      const audioBuffer = fs.readFileSync(
        req.file.path
      );

      /* Detect actual mime type */

      const mimetype = req.file.mimetype;

      console.log("Mime Type:", mimetype);

      /* Deepgram transcription */

      const response =
        await deepgram.transcription.preRecorded(
          {
            buffer: audioBuffer,

            mimetype: mimetype,
          },
          {
            punctuate: true,

            model: "nova",
          }
        );

      /* Get transcript */

      const transcription =
        response.results.channels[0]
          .alternatives[0].transcript;

      console.log("Transcript:", transcription);

      /* Save to MongoDB */

      const newTranscription =
        new Transcription({
          filename: req.file.filename,

          transcription,
        });

      await newTranscription.save();

      /* Delete uploaded file */

      fs.unlinkSync(req.file.path);

      /* Send response */

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
  }
);

app.get("/transcriptions", async (req, res) => {
  try {
    const transcriptions =
      await Transcription.find()
        .sort({ createdAt: -1 });

    res.json(transcriptions);

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Error fetching transcriptions",
    });
  }
});
/* ────────────────────────────────────────────────────────── */
/* Start Server */
/* ────────────────────────────────────────────────────────── */

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});