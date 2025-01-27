const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const router = require("./routes/userRoutes");

dotenv.config();
const app = express();
const allowedOrigins = [
    "http://localhost:3000",
];


app.use(express.json()); // Move this BEFORE routes
app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    })
);
app.use('/', router);


mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.error("MongoDB Connection Error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});