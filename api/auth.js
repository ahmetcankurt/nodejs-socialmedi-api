const jwt = require("jsonwebtoken");
require("dotenv").config();

const SECRET_KEY = process.env.JWT_SECRET_KEY || "your_jwt_secret_key";

// Middleware to verify JWT token
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(403).send("Token gereklidir");
  }

  try {
    req.user = jwt.verify(token, SECRET_KEY);
    next();
  } catch (error) {
    return res.status(401).send("Geçersiz token");
  }
}

module.exports = { verifyToken ,SECRET_KEY};
