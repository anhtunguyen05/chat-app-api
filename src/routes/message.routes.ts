import { Router, Request, Response } from "express";
import MessageController from "../app/controller/message.controller";
import { upload } from "../app/middleware/upload.middleware";

const router = Router();

router.get("/", MessageController.getAllConversations);
router.get("/conversation/:userId", MessageController.getConversation);
router.get("/group/:groupId", MessageController.getConversation);
router.post(
  "/upload-images",
  upload.array("images"),
  MessageController.uploadImages
);

export default router;
