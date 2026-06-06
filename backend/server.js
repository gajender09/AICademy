require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

const userRoutes = require("./routes/userRoutes");
const courseRoutes = require("./routes/courseRoutes");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use(cors({
  origin: "*",
}));

app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err));

app.get("/", (req, res) => {
  res.send(`
    <div style="text-align:center;font-family:sans-serif;padding:40px">
      <h1>Backend is running on Render ✅</h1>
      <img
        src="https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif"
        width="400"
      />
    </div>
  `);
});

// Default port updated to 3001 to match frontend fallback URLs
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
