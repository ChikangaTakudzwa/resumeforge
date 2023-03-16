const express = require("express");
const cors = require("cors");
const multer = require("multer");
const helmet = require("helmet");
const fs = require('fs');
const path = require("path");
const { v4: uuidv4 } = require('uuid');
const { Configuration, OpenAIApi } = require("openai");
const dotenv = require('dotenv');

// creates a new instance of the Express application.
const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet())
dotenv.config()

// adds middleware to parse incoming request bodies that are encoded in url-encoded format.
app.use(express.urlencoded({ extended: true }));
// adds middleware to parse incoming request bodies that are in JSON format.
app.use(express.json());

// adds middleware to enable CORS for all routes.
// const corsOptions = {
//     origin: 'https://*'
//   };
app.use(cors());

// Make direcory in the server root
const filedir = "uploads";

// Get the path to the current server project root directory
const projectroot = process.cwd();

// Create the new directory
fs.mkdir(`${projectroot}/${filedir}`, (err) => {
  if (err) {
    console.log(err.message);
  } else {
    console.log(`Successfully created directory ${filedir} in ${projectroot}`);
  }
});

// code for image upload with multa
app.use("/uploads", express.static("uploads"));

const storage = multer.diskStorage({
    destination: (req, photo, cb) => {
        cb(null, "uploads");
    },
    filename: (req, photo, cb) => {
        cb(null, Date.now() + path.extname(photo.originalname));
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
        max_tokens: 50,
        top_p: 1,
        frequency_penalty: 1,
        presence_penalty: 1,
    });
    console.log(response.data.choices[0].text);
    return response.data.choices[0].text;
};

// Routes
app.get('/', (req, res) => {
    res.json({
        message: "Hello world",
    });
});

app.get('/ping', (req, res) => {
    res.send('pong 🏓')
})

// array to store data from chatgpt
let database = [];

// post form data to the server, img uploaded using upload.single()
app.post('/resume/create', upload.single("photo"), async (req, res) => {
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
        id: uuidv4(),
        fullName,
        image_url: `https://resumeforge.onrender.com/uploads/${req.photo.filename}`,
        currentPosition,
        currentLength,
        currentTechnologies,
        workHistory: workArray,
    };

    // loops through the items in the workArray and converts them to a string
    const remainderText = () => {
        let stringText = "";
        for (let i = 0; i < workArray.length; i++) {
            stringText += `${workArray[i].name} as a ${workArray[i].position}.`;
        }
        return stringText;
    };

    // The job description prompt
    const prompt1 = `I am writing a resume, my details are \n name: ${fullName} \n role: ${currentPosition} (${currentLength} years). \n I write in the technolegies: ${currentTechnologies}. Can you write a 100 words description for the top of the resume(first person writing)?`;

    // The job responsibilities prompt
    const prompt2 = `I am writing a resume, my details are \n name: ${fullName} \n role: ${currentPosition} (${currentLength} years). \n I write in the technolegies: ${currentTechnologies}. Can you write 10 points for a resume on what I am good at?`;

    // The job achievements prompt
    const prompt3 = `I am writing a resume, my details are \n name: ${fullName} \n role: ${currentPosition} (${currentLength} years). \n During my years I worked at ${
        workArray.length
    } companies. ${remainderText()} \n Can you write me 50 words for each company seperated in numbers of my succession in the company (in first person)?`;

    // generate a GPT-3 result
    const objective = await GPTFunction(prompt1);
    const keypoints = await GPTFunction(prompt2);
    const jobResponsibilities = await GPTFunction(prompt3);
    // put them into an object
    const chatgptData = { objective, keypoints, jobResponsibilities };
    // log the result
    console.log(chatgptData);

    // return the AI-generated result and the information the users entered
    const data = { ...newEntry, ...chatgptData };
    database.push(data);

    res.json({
        message: "Request successful!",
        data,
    });
});

app.listen(PORT, (err, res) => {
    if (err) {
        console.log(err)
        return res.status(500).send(err.message)
    } else {
        console.log('[INFO] Server Running on port:', PORT)
    }
})