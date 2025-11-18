import { Application } from "express";
import authRouter from "./auth.routes";
import userRouter from "./user.routes";
import friendRouter from "./friend.routes";
import messageRouter from "./message.routes";
import conversationRouter from "./conversation.routes";
import groupRouter from "./group.routes";
import { verifyToken } from "../app/middleware/auth.middleware";
import { errorHandler } from "../app/middleware/errorHandler.middleware";

export default function route(app: Application): void {
  app.use(errorHandler);
  app.use("/api/auth", authRouter);
  app.use(verifyToken);
  app.use("/api/users", userRouter);
  app.use("/api/friends", friendRouter);
  app.use("/api/chats", messageRouter);
  app.use("/api/groups", groupRouter);
  app.use("/api/conversations", conversationRouter);
}
