import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors";

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {

  // Nếu không phải lỗi AppError => lỗi 500
  if (!(err instanceof AppError)) {
    console.error("UNEXPECTED ERROR:", err);

    err = new AppError("Internal Server Error", 500);
  }

  const appError = err as AppError;

  res.status(appError.statusCode).json({
    status: appError.status,
    message: appError.message,
  });
};