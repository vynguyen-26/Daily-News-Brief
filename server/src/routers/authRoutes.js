const express = require("express");
const { register, login, logout, me } = require("../controllers/authController");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.post("/signup", register);
router.post("/login", login);
router.get("/me", requireAuth, me);
router.post("/logout", logout);

module.exports = router;
