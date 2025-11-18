import { Request, Response } from "express";
import messageService from "../services/message.service";
import uploadService from "../services/upload.service";

class MessageController {
  async getAllConversations(req: Request, res: Response) {
    try {
      const userId = req.id;
      if (!userId) {
        return res.status(400).json({ message: "Thiếu userId" });
      }

      const conversations = await messageService.getAllConversations(userId);
      res.status(200).json(conversations);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error", error: err });
    }
  }

  async getConversation(req: Request, res: Response) {
  try {
    const userId = req.id; 
    const { type, targetId } = req.params;
    const { page = "1", limit = "20" } = req.query;

    if (!userId) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    if (!targetId || !type) {
      return res.status(400).json({ message: "Thiếu tham số" });
    }

    let messages;

    switch (type) {
      case "group":
        messages = await messageService.getGroupConversation(
          targetId,
          page as string,
          limit as string
        );
        break;

      case "private":
        messages = await messageService.getConversation(
          targetId,
          page as string,
          limit as string
        );
        break;

      default:
        return res.status(400).json({ message: "Loại hội thoại không hợp lệ" });
    }

    res.status(200).json(messages.reverse());
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server", error: err });
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
