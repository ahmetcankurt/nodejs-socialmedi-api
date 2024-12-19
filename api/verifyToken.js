const express = require('express');
const { verifyToken } = require('./auth'); // auth.js'deki middleware'i import et
const router = express.Router();

// Token doğrulama route'u
router.post('/verify-token', verifyToken, (req, res) => {
  // Token geçerli ise, istek devam eder
  res.json({ isValid: true });
});

module.exports = router;
