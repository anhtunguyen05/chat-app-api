import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

interface AuthPayload extends JwtPayload {
  id: string;
}

export function verifyToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = req.cookies?.accessToken as string | undefined;

  if (!token) {
    res.status(401).json({ message: "Không có token" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as AuthPayload;
    req.id = decoded.id; // ✅ gắn userId vào req
    next();
  } catch (err) {
    res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }
}
