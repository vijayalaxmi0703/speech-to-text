const express = require("express");
const multer = require("multer");
const cors = require("cors");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { Deepgram } = require("@deepgram/sdk");

const authRoutes = require("./routes/auth");
const { authMiddleware } = require("./middleware/authMiddleware");
const Transcription = require("./models/Transcription");

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

app.use("/api/auth", authRoutes);

/* ────────────────────────────────────────────────────────── */
/* Upload Route */
/* ────────────────────────────────────────────────────────── */

app.post(
  "/upload",
  authMiddleware,
  upload.single("audio"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "No audio file uploaded",
        });
      }

      const audioBuffer = fs.readFileSync(req.file.path);
      const mimetype = req.file.mimetype;

      const response = await deepgram.transcription.preRecorded(
        {
          buffer: audioBuffer,
          mimetype,
        },
        {
          punctuate: true,
          model: "nova",
        }
      );

      const transcriptionText =
        response.results.channels[0].alternatives[0].transcript;

      const newTranscription = new Transcription({
        filename: req.file.filename,
        transcription: transcriptionText,
        user: req.user.id,
      });

      await newTranscription.save();
      fs.unlinkSync(req.file.path);

      res.json({
        message: "Transcription successful",
        transcription: transcriptionText,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Error generating transcription",
      });
    }
  }
);

app.get("/transcriptions", authMiddleware, async (req, res) => {
  try {
    const transcriptions = await Transcription.find({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    res.json(transcriptions);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching transcriptions",
    });
  }
});

app.delete("/transcriptions/:id", authMiddleware, async (req, res) => {
  try {
    const transcription = await Transcription.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!transcription) {
      return res.status(404).json({
        message: "Transcript not found.",
      });
    }

    await transcription.deleteOne();
    res.json({ message: "Transcript deleted." });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error deleting transcription.",
    });
  }
});
app.use((err, req, res, next) => {
  console.error(err);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      message: "File size too large. Max 10MB allowed.",
    });
  }

  return res.status(400).json({
    message: err.message || "Something went wrong",
  });
});
/* ────────────────────────────────────────────────────────── */
/* Start Server */
/* ────────────────────────────────────────────────────────── */

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});