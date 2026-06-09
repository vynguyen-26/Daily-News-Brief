const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { AUTH_COOKIE_NAME } = require("../controllers/authController");

function parseCookies(cookieHeader = "") {
  return cookieHeader.split(";").reduce((cookies, cookie) => {
    const [rawName, ...rawValue] = cookie.trim().split("=");

    if (!rawName || rawValue.length === 0) {
      return cookies;
    }

    cookies[rawName] = decodeURIComponent(rawValue.join("="));
    return cookies;
  }, {});
}

async function requireAuth(req, res, next) {
  // Auth is based on the HTTP-only cookie set during login/signup.
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[AUTH_COOKIE_NAME];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Load the latest user from MongoDB instead of trusting client state.
    const user = await User.findById(payload.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    req.user = user;
    // Downstream controllers use req.user to scope data to this account.
    return next();
  } catch {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
    });
  }
}

module.exports = requireAuth;
