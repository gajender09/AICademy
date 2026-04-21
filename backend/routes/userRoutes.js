const express = require("express");
const bcrypt = require("bcryptjs");

const User = require("../models/User");

const router = express.Router();

// Register Route
router.post("/register", async (req, res) => {
  try {
    console.log("BODY:", req.body);

    if (!req.body) {
      return res.status(400).json({ message: "No data received" });
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });

  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});
// Login Route
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        // Return user details along with the login success message
        return res.status(200).json({
            message: 'Login successful',
            user: {
                name: user.name,       // Include the user's name
                email: user.email,     // Include email or other details if needed
                // Optionally include other user details like profile picture, role, etc.
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;
