const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class AuthService {
  generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "30d" });
  };

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

    // Tạo token
    const token = this.generateToken({ id: newUser._id });

    // Trả dữ liệu
    return {
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
      token,
    };
  }

  // Đăng nhập
  async login({ email, password }) {
    // Tìm user theo email hoặc username
    const user = await User.findOne({
      $or: [{ email: email }],
    });
    if (!user) throw new Error("Không tìm thấy tài khoản");

    // So sánh password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("Sai mật khẩu");

    // Tạo token
    const token = this.generateToken({ id: user._id });

    return {
      user: { id: user._id, username: user.username, email: user.email },
      token,
    };
  }

  async googleLogin(googleToken) {
    // 1️⃣ Verify ID token với Google
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, picture } = payload;

    // 2️⃣ Tìm hoặc tạo user
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

    // 3️⃣ Tạo JWT của hệ thống để frontend dùng
    const token = this.generateToken({ id: user._id });

    return {
      message: "Login Google thành công",
      user: {
        id: user._id,
        email: user.email,
        avatar: user.avatar,
      },
      token,
    };
  }
}

module.exports = new AuthService();
