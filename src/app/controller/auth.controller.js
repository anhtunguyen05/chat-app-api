// controllers/AuthController.js
const User = require("../models/user.model");
const authService = require("../services/auth.service");

class AuthController {
  async refreshToken(req, res) {
    try {
      const oldRefreshToken = req.cookies.refreshToken;
      const { accessToken, refreshToken } = await authService.refreshToken(
        oldRefreshToken
      );

      authService.saveRefreshToken(res, refreshToken);

      return res.json({ accessToken });
    } catch (err) {
      return res.status(401).json({ message: err.message });
    }
  }

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
      const { user, accessToken, refreshToken } = await authService.login(
        req.body,
        res
      );

      authService.saveToken(res, accessToken);
      authService.saveRefreshToken(res, refreshToken);

      return res.json({
        user,
        message: "Login success",
      });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  async googleLogin(req, res) {
    try {
      console.log("req.body:", req.body);
      const { token } = req.body; // token từ frontend
      const { user, accessToken, refreshToken } = await authService.googleLogin(
        token
      );

      authService.saveToken(res, accessToken);
      authService.saveRefreshToken(res, refreshToken);

      return res.json({
        user,
        message: "Login success",
      });
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
