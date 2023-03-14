const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

// creates a new instance of the Express application.
const app = express();
const PORT = 4000;

// adds middleware to parse incoming request bodies that are encoded in url-encoded format.
app.use(express.urlencoded({ extended: true }));
// adds middleware to parse incoming request bodies that are in JSON format.
app.use(express.json());
// adds middleware to enable CORS for all routes.
app.use(cors());

// code for image upload with multa
app.use("/uploads", express.static("uploads"));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 },
});

// Routes
app.get("/api", (req, res) => {
    res.json({
        message: "Hello world",
    });
});

app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});