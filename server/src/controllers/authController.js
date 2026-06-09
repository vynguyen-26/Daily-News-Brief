const bcrypt = require("bcryptjs");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const AUTH_COOKIE_NAME = "dailyNewsAuth";

function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    // Keep the JWT out of localStorage so browser scripts cannot read it.
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

function createToken(user) {
  return jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function sendAuthResponse(res, status, user) {
  const token = createToken(user);

  // The browser stores this cookie and sends it with later API requests.
  res.cookie(AUTH_COOKIE_NAME, token, getCookieOptions());

  return res.status(status).json({
    success: true,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
    },
  });
}

async function register(req, res) {
  const { fullName, email, password, confirmPassword } = req.body;
  // Normalize email before lookup/create so each account is unique by email.
  const normalizedEmail = email?.trim().toLowerCase();

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
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    return sendAuthResponse(res, 201, newUser);
  } catch (error) {
    console.error("Register error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Server error. Please try again.",
    });
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: "Please fill in all fields",
    });
  }

  try {
    const user = await User.findOne({ email: normalizedEmail });

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

    return sendAuthResponse(res, 200, user);
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Server error. Please try again.",
    });
  }
}

async function me(req, res) {
  // requireAuth already verified the cookie and loaded the MongoDB user.
  return res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      fullName: req.user.fullName,
      email: req.user.email,
    },
  });
}

async function logout(req, res) {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return res.status(200).json({ success: true });
}

module.exports = { AUTH_COOKIE_NAME, register, login, me, logout };
