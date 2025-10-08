import { Request, Response } from "express";
import friendService from "../services/friend.service";

class FriendController {
  async sendRequest(req: Request, res: Response) {
    try {
      const fromId = req.id; // Lấy từ middleware auth
      const { toId } = req.body;

      const result = await friendService.sendFriendRequest(
        fromId as string,
        toId
      );
      res.status(201).json({ message: "Đã gửi lời mời kết bạn", data: result });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async acceptRequest(req: Request, res: Response) {
    try {
      const { requestId } = req.params;
      const result = await friendService.acceptFriendRequest(
        requestId as string
      );
      res.json({ message: "Đã chấp nhận lời mời kết bạn", data: result });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getFriends(req: Request, res: Response) {
    try {
      const userId = req.id;
      const friends = await friendService.getFriendList(userId as string);
      res.json({ data: friends });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getFriendRequests(req: Request, res: Response) {
    try {
      const userId = req.id;
      const friends = await friendService.getFriendRequestList(
        userId as string
      );
      res.json({ data: friends });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}

export default new FriendController();
