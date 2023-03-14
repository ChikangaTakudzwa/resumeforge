const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const { Configuration, OpenAIApi } = require("openai");
const dotenv = require('dotenv');
dotenv.config()

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

// OpenAI intergration
const configuration = new Configuration({
    apiKey: process.env.API_KEY,
});

const openai = new OpenAIApi(configuration);

const GPTFunction = async (text) => {
    const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: text,
        temperature: 0.6,
        max_tokens: 5,
        top_p: 1,
        frequency_penalty: 1,
        presence_penalty: 1,
    });
    console.log(response.data.choices[0].text);
    return response.data.choices[0].text;
};

// Routes
app.get("/api", (req, res) => {
    res.json({
        message: "Hello world",
    });
});

// post form data to the server, img uploaded using upload.single()
app.post("/resume/create", upload.single("headshotImage"), async (req, res) => {
    const {
        fullName,
        currentPosition,
        currentLength,
        currentTechnologies,
        workHistory, //JSON format
    } = req.body;

    const workArray = JSON.parse(workHistory); //an array

    // group the values into an object
    const newEntry = {
        id: generateID(),
        fullName,
        image_url: `http://localhost:4000/uploads/${req.file.filename}`,
        currentPosition,
        currentLength,
        currentTechnologies,
        workHistory: workArray,
    };
});

app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});