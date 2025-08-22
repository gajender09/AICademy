const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const courseRoutes = require("./routes/courseRoutes");

dotenv.config();
const app = express();

const allowedOrigins = ["http://localhost:3000", "https://aicademy-mu.vercel.app"];

app.use(express.json());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);


// Routes
app.use("/", userRoutes);
app.use("/api", courseRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get("/", (req, res) => {
  res.send("AICademy Backend is running ✅");
});
