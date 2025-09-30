import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

// 🔹 Mở rộng interface Request để có thể gắn user vào req
declare module "express-serve-static-core" {
  interface Request {
    user?: string | JwtPayload;
  }
}

export function verifyToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = req.cookies?.accessToken as string | undefined; // token trong cookie httpOnly

  if (!token) {
    res.status(401).json({ message: "Không có token" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = decoded; // gắn user id hoặc payload vào req
    next();
  } catch (err) {
    res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }
}
