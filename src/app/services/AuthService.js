const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");

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
}

module.exports = new AuthService();
