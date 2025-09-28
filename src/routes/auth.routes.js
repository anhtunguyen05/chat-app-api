// routes/auth.js
const express = require("express");

const {
  registerValidator,
  loginValidator,
} = require("../validators/auth.validator");
const validateRequest = require("../app/middleware/validateRequest.middleware");

const AuthController = require("../app/controller/auth.controller");

const router = express.Router();

// Routes gọi thẳng method của class
router.post(
  "/register",
  registerValidator,
  validateRequest,
  AuthController.register
);
router.post("/login", loginValidator, validateRequest, AuthController.login);
router.post("/google", AuthController.googleLogin);
router.post("/logout", AuthController.logout);
router.post("/refresh-token", AuthController.refreshToken);

module.exports = router;
