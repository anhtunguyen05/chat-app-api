import { AppError } from "../errors";

// 🔹 Mở rộng interface Request để có thể gắn userId vào req
declare module "express-serve-static-core" {
  interface Request {
    id?: string;
  }
}

export {};