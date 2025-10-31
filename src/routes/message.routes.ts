import { Router, Request, Response } from "express";
import MessageController from "../app/controller/message.controller";
import { verifyToken } from "../app/middleware/auth.middleware";
import { upload } from "../app/middleware/upload.middleware";

const router = Router();

router.get("/conversation/:userId", MessageController.getConversation);
router.post(
  "/upload-images",
  upload.array("images"),
  MessageController.uploadImages
);

export default router;
