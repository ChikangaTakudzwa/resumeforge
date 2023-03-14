const express = require("express");
const cors = require("cors");
// creates a new instance of the Express application.
const app = express();
const PORT = 4000;

// adds middleware to parse incoming request bodies that are encoded in url-encoded format.
app.use(express.urlencoded({ extended: true }));
// adds middleware to parse incoming request bodies that are in JSON format.
app.use(express.json());
// adds middleware to enable CORS for all routes.
app.use(cors());

app.get("/api", (req, res) => {
    res.json({
        message: "Hello world",
    });
});

app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});