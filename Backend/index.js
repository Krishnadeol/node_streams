const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { Transform } = require("stream");
const { Readable } = require("stream");

const app = express();
const PORT = 3001;

const cors = require("cors");

const corsOptions = {
  origin: "http://localhost:5173",
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

const CHUNK_SIZE = 5000 * 1024;

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running and ready to stream.");
});

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// Function to create a writable stream for each chunk
function createWriteStream(chunkIndex) {
  const chunkPath = path.join("uploads", `chunk_${Date.now()}_${chunkIndex}`);
  return fs.createWriteStream(chunkPath);
}

app.post("/upload", upload.single("file"), (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).send({ message: "Please upload a file." });
  }

  // Convert buffer to readable stream
  const fileStream = new Readable();
  fileStream.push(file.buffer);
  fileStream.push(null);

  let chunkIndex = 0;
  let currentStream = createWriteStream(chunkIndex);
  let currentSize = 0;

  const transformStream = new Transform({
    transform(chunk, encoding, callback) {
      try {
        // Process the chunk
        while (currentSize + chunk.length > CHUNK_SIZE) {
          const remainingSpace = CHUNK_SIZE - currentSize;
          const firstChunk = chunk.slice(0, remainingSpace);
          chunk = chunk.slice(remainingSpace);

          currentStream.write(firstChunk, encoding, () => {
            currentStream.end();
            currentStream = createWriteStream(++chunkIndex);
            currentSize = 0;
          });

          currentSize = chunk.length;
        }

        currentStream.write(chunk, encoding, () => {
          currentSize += chunk.length;
          callback();
        });
      } catch (err) {
        callback(err);
      }
    },
    flush(callback) {
      currentStream.end(callback);
    },
  });

  fileStream
    .pipe(transformStream)
    .on("finish", () => {
      res.status(200).send({ message: "File uploaded successfully." });
    })
    .on("error", (err) => {
      res
        .status(500)
        .send({ message: "Error uploading the file.", error: err.message });
    });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
