const express = require("express");
const router = express.Router();
const { User } = require("../index");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const { verifyToken , SECRET_KEY } = require('./auth'); // Auth middleware'ini import ettik

// POST /login
router.post("/", async (req, res) => {
  const { username, password } = req.body;

  // Kullanıcı adı ve şifre doğrulaması
  const user = await User.findOne({ where: { username, password } });
  if (!user) {
    return res.status(401).send("Kullanıcı adı veya şifre hatalı");
  }

  // JWT oluşturma
  const token = jwt.sign({ userId: user.userId }, SECRET_KEY, {
    expiresIn: "1h",
  });
  res.json({
    token,
    user: {
      userId: user.userId,
      name: user.name,
      surname: user.surname,
      username: user.username,
    },
  });
});

module.exports = { router, verifyToken };
