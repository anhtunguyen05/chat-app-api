import { Request, Response } from "express";
import messageService from "../services/message.service";

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
}

export default new MessageController();
