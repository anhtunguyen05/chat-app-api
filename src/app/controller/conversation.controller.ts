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

  async createGroup(req: Request, res: Response) {
    try {
      const { name, avatar, memberIds } = req.body;
      const creatorId = req.id;

      if (!creatorId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (!name) {
        return res.status(400).json({ message: "Group name is required" });
      }

      const group = await ConversationService.createGroupChat({
        name,
        avatar,
        creatorId,
        memberIds,
      });

      return res.status(201).json({
        message: "Group chat created successfully",
        data: group,
      });
    } catch (err: any) {
      console.error("Error creating group chat:", err);
      return res.status(500).json({ message: err.message });
    }
  }

  async addMembers(req: Request, res: Response) {
    try {
      const { conversationId } = req.params;
      const { userIds } = req.body;

      if (!conversationId) {
        return res.status(400).json({ message: "conversationId is required" });
      }
      if (!userIds || !Array.isArray(userIds)) {
        return res.status(400).json({ message: "userIds must be an array" });
      }

      const updatedGroup = await ConversationService.addMembersToGroup(
        conversationId,
        userIds
      );

      return res.status(200).json({
        message: "Members added successfully",
        data: updatedGroup,
      });
    } catch (err: any) {
      console.error("Error adding members:", err);
      return res.status(500).json({ message: err.message });
    }
  }

  async removeMember(req: Request, res: Response) {
    try {
      const { conversationId } = req.params;
      const { userId } = req.body;

      if (!conversationId) {
        return res.status(400).json({ message: "conversationId is required" });
      }
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }

      const updatedGroup = await ConversationService.removeMemberFromGroup(
        conversationId,
        userId
      );

      return res.status(200).json({
        message: "Member removed successfully",
        data: updatedGroup,
      });
    } catch (err: any) {
      console.error("Error removing member:", err);
      return res.status(500).json({ message: err.message });
    }
  }

  async getGroupMembers(req: Request, res: Response) {
    try {
      const { conversationId } = req.params;
      if (!conversationId) {
        return res.status(400).json({ message: "conversationId is required" });
      }
      const members = await ConversationService.getGroupMembers(conversationId);
      return res.status(200).json({
        success: true,
        data: members,
      });
    } catch (err: any) {
      console.error("Error fetching group members:", err);
      return res.status(500).json({ message: err.message });
    }
  }
}

export default new ConversationController();
