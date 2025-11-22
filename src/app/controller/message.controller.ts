import { Request, Response } from "express";
import redis from "../../config/redis.config";
import messageService from "../services/message.service";
import uploadService from "../services/upload.service";

class MessageController {
  async getConversation(req: Request, res: Response) {
    try {
      const userId = req.id;
      const { conversationId } = req.params;
      const { page = "1", limit = "20" } = req.query;

      if (!userId) {
        return res.status(401).json({ message: "Chưa đăng nhập" });
      }

      if (!conversationId) {
        return res.status(400).json({ message: "Thiếu tham số" });
      }

      let messages;
      messages = await messageService.getMessages(
        conversationId,
        page as string,
        limit as string
      );

      return res.json(messages.reverse());
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

  async getPendingMessages(req: Request, res: Response) {
    const userId = req.id;

    const raw = await redis.lrange(`pending:${userId}`, 0, -1);
    const messages = raw.map((item: string) => JSON.parse(item));

    // Clear ngay sau khi gửi pending
    await redis.del(`pending:${userId}`);

    return res.json({ messages });
  }
}

export default new MessageController();
