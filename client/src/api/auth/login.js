import User from "../../../server/src/models/User";

const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Please fill in all fields",
      });
    }

    try {
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({
          success: false,
          error: "Invalid email or password",
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({
          success: false,
          error: "Invalid email or password",
        });
      }

      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        success: true,
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
        },
      });
    } catch (error) {
      console.error("Login error:", error.message);
      return res.status(500).json({
        success: false,
        error: "Server error. Please try again.",
      });
    }
}
module.exports = { register, login };