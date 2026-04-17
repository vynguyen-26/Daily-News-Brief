import User from "../../../server/src/models/User";

const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function register(req, res) {
    const { fullName, email, password, confirmPassword } = req.body;

    if (!fullName || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: "Please fill in all fields",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: "Passwords do not match",
      });
    }

    try {
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: "User already exists",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await User.create({
        fullName,
        email,
        password: hashedPassword,
      });

      return res.status(201).json({
        success: true,
        userId: newUser._id,
        fullName: newUser.fullName,
      });
    } catch (error) {
      console.error("Register error:", error.message);
      return res.status(500).json({
        success: false,
        error: "Server error. Please try again.",
      });
    }
}
module.exports = { register };