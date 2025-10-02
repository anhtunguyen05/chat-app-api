import { Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import { User, IUser } from "../models/user.model"; // cần tạo type cho User
// Nếu bạn chưa có IUserDocument:
//   export interface IUserDocument extends Document { email:string; password?:string; avatar?:string; }

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

interface JwtUserPayload {
  id: string;
}

export class AuthService {
  // Access token
  generateToken(payload: JwtUserPayload): string {
    return jwt.sign(payload, process.env.JWT_SECRET as string, {
      expiresIn: "15m",
    });
  }

  // Refresh token
  generateRefreshToken(payload: JwtUserPayload): string {
    return jwt.sign(payload, process.env.REFRESH_SECRET as string, {
      expiresIn: "7d",
    });
  }

  saveToken(res: Response, accessToken: string): void {
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
      path: "/",
    });
  }

  saveRefreshToken(res: Response, refreshToken: string): void {
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new Error("No refresh token provided");
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_SECRET as string
      ) as JwtPayload;
    } catch {
      throw new Error("Invalid or expired refresh token");
    }

    const user = await User.findById(decoded.id);
    if (!user) throw new Error("User not found");

    const newAccessToken = this.generateToken({ id: user.id.toString() });
    const newRefreshToken = this.generateRefreshToken({
      id: user.id.toString(),
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async register({ email, password }: { email: string; password: string }) {
    const existing = await User.findOne({ email });
    if (existing) throw new Error("Email đã tồn tại");

    const hashed = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      email,
      password: hashed,
    });

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
      },
    };
  }

  async login(
    { email, password }: { email: string; password: string },
    res?: Response
  ) {
    const user = await User.findOne({ email });
    if (!user || !user.password) throw new Error("Không tìm thấy tài khoản");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("Sai mật khẩu");

    const accessToken = this.generateToken({ id: user.id.toString() });
    const refreshToken = this.generateRefreshToken({ id: user.id.toString() });

    return {
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
      },
      accessToken,
      refreshToken,
    };
  }

  async googleLogin(googleToken: string) {
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID!,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) throw new Error("Google payload invalid");

    const { email, picture } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        avatarUrl: picture,
      });
    } else if (!user.avatarUrl) {
      user.avatarUrl = picture;
      await user.save();
    }

    const accessToken = this.generateToken({ id: user.id.toString() });
    const refreshToken = this.generateRefreshToken({ id: user.id.toString() });

    return {
      user: {
        id: user.id,
        email: user.email,
        avatar: user.avatarUrl,
      },
      accessToken,
      refreshToken,
    };
  }

  async logout(res: Response) {
    res.clearCookie("accessToken", { path: "/" });
    res.clearCookie("refreshToken", { path: "/" });
    return { message: "Logout success" };
  }
}

// Export instance
export default new AuthService();
