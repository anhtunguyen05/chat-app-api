import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

export default function validateRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Trả về mảng lỗi chi tiết
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
}
