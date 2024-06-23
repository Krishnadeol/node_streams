const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3001;

const cors = require("cors");

const corsOptions = {
  origin: "http://localhost:5173",
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// ye multer ko set-up krne ke liye hai.

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // file ka nam
  },
});

const upload = multer({ storage });

app.use(express.json());
app.get("/", () => {
  console.log("We are streaming now");
});

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// yeha pr pehle file ai then file ko extract kiya then file ko read kiya ( chunks me convert kiya ) then usko write kiya

app.post("/upload", upload.single("file"), (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).send({ message: "Please upload a file." });
  }

  const fileStream = fs.createReadStream(file.path);
  const writeStream = fs.createWriteStream(`uploads/${file.filename}`);

  fileStream.pipe(writeStream);

  writeStream.on("finish", () => {
    res
      .status(200)
      .send({ message: "File uploaded successfully.", file: file.filename });
  });

  writeStream.on("error", (err) => {
    res
      .status(500)
      .send({ message: "Error saving the file.", error: err.message });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
