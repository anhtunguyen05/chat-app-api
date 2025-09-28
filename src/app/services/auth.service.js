const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/user.model");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class AuthService {
  generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "15m" });
  };

  generateRefreshToken(payload) {
    return jwt.sign(payload, process.env.REFRESH_SECRET, { expiresIn: "7d" });
  }

  saveToken = async (res, accessToken) => {
    res.cookie("accessToken", accessToken, {
      httpOnly: true, // không cho JS đọc
      secure: false, // chỉ gửi qua HTTPS khi prod
      sameSite: "none", // chống CSRF
      maxAge: 15 * 60 * 1000, // 15 phút
      path: "/",
    });
  };

  saveRefreshToken(res, refreshToken) {
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
      path: "/auth/refresh",
    });
  }

  async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw new Error("No refresh token provided");
    }

    // ✅ Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    } catch (err) {
      throw new Error("Invalid or expired refresh token");
    }

    // 🔎 Check user tồn tại
    const user = await User.findById(decoded.id);
    if (!user) throw new Error("User not found");

    // 🔑 Tạo access token mới
    const newAccessToken = this.generateAccessToken({ id: user._id });

    // ⚡ (Tuỳ chọn) Rotate refresh token
    const newRefreshToken = this.generateRefreshToken({ id: user._id });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  // Đăng ký
  async register({ email, password }) {
    // Check user đã tồn tại chưa
    const existing = await User.findOne({
      $or: [{ email }],
    });
    if (existing) throw new Error("Email đã tồn tại");

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Tạo user mới & lưu DB
    const newUser = await User.create({
      email,
      password: hashed,
    });

    return {
      user: {
        id: newUser._id,
        email: newUser.email,
      },
    };
  }

  // Đăng nhập
  async login({ email, password }, res) {
    // Tìm user
    const user = await User.findOne({ email });
    if (!user) throw new Error("Không tìm thấy tài khoản");

    // So sánh password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("Sai mật khẩu");

    const accessToken = this.generateToken({ id: user._id });
    const refreshToken = this.generateRefreshToken({ id: user._id });

    return {
      user: {
        id: user._id,
        email: user.email,
      },
      accessToken,
      refreshToken,
    };
  }

  async googleLogin(googleToken) {
    // Verify ID token với Google
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, picture } = payload;

    // Tìm hoặc tạo user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        avatar: picture, // ✅ Lưu avatar Google
        // provider: "google",
      });
    } else {
      // Cập nhật avatar nếu user chưa có
      if (!user.avatar) {
        user.avatar = picture;
        await user.save();
      }
    }

    // Tạo JWT của hệ thống để frontend dùng
    const accessToken = this.generateToken({ id: user._id });
    const refreshToken = this.generateRefreshToken({ id: user._id });

    return {
      user: {
        id: user._id,
        email: user.email,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken,
    };
  }

  async logout(res) {
    res.clearCookie("accessToken", { path: "/" });
    res.clearCookie("refreshToken", { path: "/" });
    return { message: "Logout success" };
  }
}

module.exports = new AuthService();
