import { Router, Request, Response } from "express";
import MessageController from "../app/controller/message.controller";
import { verifyToken } from "../app/middleware/auth.middleware";

const router = Router();

router.get("/conversation/:userId", verifyToken, MessageController.getConversation);

export default router;