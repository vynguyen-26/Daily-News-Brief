const express = require("express");
const cors = require("cors");
const authRoutes = require("./routers/authRoutes");
const newsRoutes = require("./routers/newsRoute");
const savedArticleRoutes = require("./routers/savedArticleRoutes");

const app = express();

app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true,
    })
);
app.use(express.json());

app.get("/", (req, res) => {
    res.send("API is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/saved-articles", savedArticleRoutes);

module.exports = app;
