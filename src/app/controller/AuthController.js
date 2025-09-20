// controllers/AuthController.js
const User = require("../models/User");
const authService = require("../services/AuthService");

class AuthController {
  // [POST] /api/auth/register
  async register(req, res) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  async login(req, res) {
    try {
      const result = await authService.login(req.body);
      res.json(result);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
}

// Export instance để dùng trực tiếp
module.exports = new AuthController();
