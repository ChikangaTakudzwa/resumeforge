const { Configuration, OpenAIApi } = require("openai");
const express = require("express");
const multer = require("multer");
const helmet = require("helmet");
const dotenv = require('dotenv');
const path = require("path");
const cors = require("cors");
const fs = require("fs");

// creates a new instance of the Express application.
const app = express();

app.use(helmet())
dotenv.config()
const PORT = process.env.PORT || 4000;

// adds middleware to parse incoming request bodies that are encoded in url-encoded format
// adds middleware to parse incoming request bodies that are in JSON format.
app.use(express.urlencoded({ extended: true }));
// code for image upload with multa
app.use("/uploads", express.static("uploads"));
app.use(express.json());
app.use(cors());

const generateID = () => Math.random().toString(36).substring(2, 10);

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads'); // specify the folder to store the uploaded file
    },
    filename: function (req, file, cb) {
        var split_file_name = file.originalname.split(".");
		var name = split_file_name[0];
		var extension = split_file_name[1];
        cb(null, name + '-' + Date.now() + '.' + extension); // set the filename to the original name of the uploaded file
    }
});
const fileFilter = function (req, file, cb) {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true); // accept file
    } else {
        cb(new Error('Invalid file type. Only JPEG and PNG are allowed.'), false); // reject file
    }
};
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // set the maximum file size (in bytes)
    },
    fileFilter: fileFilter
});

// OpenAI intergration
const configuration = new Configuration({
    apiKey: process.env.API_KEY,
});

const openai = new OpenAIApi(configuration);

const database = [];

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

// post form data to the server, img uploaded using upload.single()
app.post('/resume/create', upload.single('photo'), async (req, res) => {
    console.log(req.file.filename);
    try {
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
            image_url: `https://resumeforge.onrender.com/uploads/${req.file.filename}`,
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
        const objective = await GPTFunction(prompt1).catch((err) => {
            console.error(`Error calling GPTFunction with prompt 1 : ${err}`);
            throw err;
        });
        const keypoints = await GPTFunction(prompt2).catch((err) => {
            console.error(`Error calling GPTFunction with prompt 2 : ${err}`);
            throw err;
        });
        const jobResponsibilities = await GPTFunction(prompt3).catch((err) => {
            console.error(`Error calling GPTFunction with prompt 3 : ${err}`);
            throw err;
        });
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
    } catch (err) {
        console.error(`Error handling request: ${err}`);
        res.status(500).json({ message: 'Internal Server Error' });
    }
    
});

app.listen(PORT, (err, res) => {
    if (err) {
        console.log(err)
        return res.status(500).send(err.message)
    } else {
        console.log('[INFO] Server Running on port:', PORT)
    }
})