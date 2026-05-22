const express = require("express");
const multer = require("multer");
const cors = require("cors");
const app = express();
const PORT = 5000;
app.use(cors());
app.use(express.json());

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

/* Test Route */
app.get("/", (req, res) => {
  res.send("Backend is running");
});

/* Upload Route */
app.post("/upload", upload.single("audio"), (req, res) => {
  res.json({
    message: "File uploaded successfully",
    file: req.file,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});