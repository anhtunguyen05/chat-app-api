import { Router, Request, Response } from "express";
import ConversationController from "../app/controller/conversation.controller";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  return ConversationController.getMySidebar(req, res);
});

export default router;
