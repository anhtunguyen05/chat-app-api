import { Application } from "express";
import authRouter from "./auth.routes";
import userRouter from "./user.routes";
import friendRouter from "./friend.routes"

export default function route(app: Application): void {
  app.use("/api/auth", authRouter);
  app.use("/api/users", userRouter);
  app.use("/api/friends", friendRouter)
}
