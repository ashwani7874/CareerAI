const resumeRoutes = require("./routes/resumeRoutes");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Welcome to CareerAI API!");
});


app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "CareerAI server is running!"
    });
});


app.use("/api/auth", authRoutes);
app.use("/api/resumes", resumeRoutes);


const startServer = async () => {
    await connectDB();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(`CareerAI running on port ${PORT}`);
    });
};

startServer();
