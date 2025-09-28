const express = require("express");
const { verifyToken } = require("../app/middleware/auth.middleware");


const router = express.Router();

// ✅ PRIVATE – check JWT trước khi vào controller
router.get("/me", verifyToken, (req, res) => {
  console.log("raw cookie header:", req.headers.cookie);
  console.log("parsed cookies:", req.cookies);
  res.json({ cookies: req.cookies || null });
});

module.exports = router;
