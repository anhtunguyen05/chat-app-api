import { Request, Response } from "express";
import messageService from "../services/message.service";
import uploadService from "../services/upload.service";

class MessageController {
  async getConversation(req: Request, res: Response) {
    try {
      const user1 = req.id; // user hiện tại
      const user2 = req.params.userId;
      const groupId = req.params.groupId; // thêm vào nếu là nhóm
      const { page = "1", limit = "20" } = req.query;

      if (!page || !limit) {
        return res.status(400).json({ message: "Thiếu tham số phân trang" });
      }

      let messages;

      if (groupId) {
        // 🔹 Lấy tin nhắn trong nhóm
        messages = await messageService.getGroupConversation(
          groupId,
          page as string,
          limit as string
        );
      } else if (user1 && user2) {
        // 🔹 Lấy tin nhắn 1-1
        messages = await messageService.getConversation(
          user1,
          user2,
          page as string,
          limit as string
        );
      } else {
        return res.status(400).json({ message: "Thiếu user hoặc groupId" });
      }

      res.status(200).json(messages.reverse());
    } catch (err) {
      console.error(err);
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
