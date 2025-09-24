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
    console.log("BODY >>>", req.body); 
    try {
      const result = await authService.login(req.body, res);
      res.json(result);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

   async googleLogin(req, res) {
    try {
      console.log("req.body:", req.body);
      const { token } = req.body; // token từ frontend
      const result = await authService.googleLogin(token);
      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: err.message });
    }
  }

  async logout(req, res) {
    try {
      const result = await authService.logout(res);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
}

// Export instance để dùng trực tiếp
module.exports = new AuthController();
