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

    // 🔑 Set cookie HTTP-only
    res.cookie("token", token, {
      httpOnly: true, // không cho JS đọc
      secure: false, // chỉ gửi qua HTTPS khi prod
      sameSite: "none", // chống CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
      path: "/",
    });

    // Trả dữ liệu
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

    // Tạo token
    const token = this.generateToken({ id: user._id });

    // 🔑 Set cookie HTTP-only
    res.cookie("token", token, {
      httpOnly: true, // không cho JS đọc
      secure: false, // chỉ gửi qua HTTPS khi prod
      sameSite: "none", // chống CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
      path: "/",
    });

    // Trả về thông tin user (không cần token)
    return {
      user: {
        id: user._id,
        email: user.email,
      },
      message: "Login success",
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

  async logout(res) {
    res.clearCookie("token", {
      httpOnly: true,
      secure: false, // production nên là true (HTTPS)
      sameSite: "none", // phải khớp với cookie đã set
      path: "/", // khớp path
    });

    return { message: "Logout success" };
  }
}

module.exports = new AuthService();
