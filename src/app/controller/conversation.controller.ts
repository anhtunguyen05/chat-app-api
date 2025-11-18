import { Request, Response } from "express";
import ConversationService from "../services/conversation.service";

class ConversationController {
  async getMySidebar(req: Request, res: Response) {
    try {
      const userId = req.id; 
      if (!userId) throw new Error("User ID not found in request");
      
      const conversations = await ConversationService.getSidebarConversations(
        userId
      );

      res.json({
        success: true,
        data: conversations,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Failed to load conversations",
      });
    }
  }
}

export default new ConversationController();
