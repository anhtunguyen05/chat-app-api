// routes/auth.js
const express = require("express");
const router = express.Router();
const AuthController = require("../app/controller/AuthController");
const {
  registerValidator,
  loginValidator,
} = require("../validators/authValidator");
const validateRequest = require("../app/middleware/validateRequest");

// Routes gọi thẳng method của class
router.post(
  "/register",
  registerValidator,
  validateRequest,
  AuthController.register
);
router.post("/login", loginValidator, validateRequest, AuthController.login);

module.exports = router;
