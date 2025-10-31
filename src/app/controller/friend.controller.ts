import { Request, Response } from "express";
import friendService from "../services/friend.service";

class FriendController {
  async sendRequest(req: Request, res: Response) {
    try {
      const fromId = req.id;
      const toId = req.params.toId;

      const result = await friendService.sendFriendRequest(
        fromId as string,
        toId as string
      );
      res.status(201).json({ message: "Đã gửi lời mời kết bạn", data: result });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async acceptRequest(req: Request, res: Response) {
    try {
      const toId = req.id; // người đang đăng nhập
      const fromId = req.params.fromId; // người đã gửi lời mời

      const result = await friendService.acceptFriendRequest(
        fromId as string,
        toId as string
      );
      res.json({ message: "Đã chấp nhận lời mời kết bạn", data: result });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async rejectRequest(req: Request, res: Response) {
    try {
      const toId = req.id; // người đang đăng nhập
      const fromId = req.params.fromId; // người đã gửi lời mời
      const result = await friendService.rejectFriendRequest(
        fromId as string,
        toId as string
      );
      res.json({ message: "Đã từ chối lời mời kết bạn", data: result });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  async cancelRequest(req: Request, res: Response) {
    try {
      const fromId = req.id; // người đang đăng nhập
      const toId = req.params.toId; // người đã gửi lời mời
      const result = await friendService.cancelFriendRequest(
        fromId as string,
        toId as string
      );
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  async unfriend(req: Request, res: Response) {
    try {
      const userId1 = req.id; // người đang đăng nhập
      const userId2 = req.params.userId; // người đã gửi lời mời
      const result = await friendService.unfriend(
        userId1 as string,
        userId2 as string
      );
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
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

  async getNoneFriends(req: Request, res: Response) {
    try {
      const userId = req.id;
      const friends = await friendService.getNoneFriendList(userId as string);
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
