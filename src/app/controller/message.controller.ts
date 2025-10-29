import { Request, Response } from "express";
import messageService from "../services/message.service";
import uploadService from "../services/upload.service";

class MessageController {
  async getConversation(req: Request, res: Response) {
    try {
      const user1 = req.id; // từ verifyToken middleware
      const user2 = req.params.userId;
      const messages = await messageService.getConversation(
        user1 as string,
        user2 as string
      );
      res.json(messages);
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err });
    }
  }

  async uploadImages(req: Request, res: Response) {
    try {
      if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }
      const files = req.files as Express.Multer.File[];
      const imageUrls = await uploadService.uploadMessageImages(
        files,
        "messages"
      );
      res.json(imageUrls);
    } catch (err) {
      res.status(500).json({ message: "Image upload failed", error: err });
    }
  }
}

export default new MessageController();
