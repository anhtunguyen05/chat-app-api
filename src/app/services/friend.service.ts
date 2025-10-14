import { Types } from "mongoose";
import { User } from "../models/user.model";
import { FriendRequest } from "../models/friendRequest.model";

class FriendService {
  async sendFriendRequest(fromId: string, toId: string) {
    if (fromId === toId) throw new Error("Không thể kết bạn với chính mình");

    const existing = await FriendRequest.findOne({
      $or: [
        { from: fromId, to: toId },
        { from: toId, to: fromId },
      ],
    });

    if (existing) throw new Error("Yêu cầu kết bạn đã tồn tại");

    const newRequest = await FriendRequest.create({ from: fromId, to: toId });
    return newRequest;
  }

  async acceptFriendRequest(fromId: string, toId: string) {
    const request = await FriendRequest.findOne({
      from: fromId,
      to: toId,
      status: "pending",
    });
    if (!request) throw new Error("Không tìm thấy yêu cầu kết bạn");

    request.status = "accepted";
    await request.save();

    // ✅ Sau này có thể thêm logic thêm bạn vào danh sách friends của cả 2 users
    return request;
  }

  async rejectFriendRequest(fromId: string, toId: string) {
    const request = await FriendRequest.findOne({
      from: fromId,
      to: toId,
      status: "pending",
    });
    if (!request) throw new Error("Không tìm thấy yêu cầu kết bạn để từ chối");

    request.status = "rejected";
    await request.save();
    return request;
  }

  async cancelFriendRequest(fromId: string, toId: string) {
    const request = await FriendRequest.findOneAndDelete({
      from: fromId,
      to: toId,
      status: "pending",
    });
    if (!request) throw new Error("Không tìm thấy yêu cầu kết bạn để từ chối");

    if (!request) throw new Error("Không tìm thấy yêu cầu kết bạn để hủy");
    return { message: "Đã hủy yêu cầu kết bạn" };
  }

  async unfriend(userId1: string, userId2: string) {
    const friendship = await FriendRequest.findOneAndDelete({
      $or: [
        { from: userId1, to: userId2, status: "accepted" },
        { from: userId2, to: userId1, status: "accepted" },
      ],
    });

    if (!friendship) throw new Error("Hai người không phải bạn bè");
    return { message: "Đã hủy kết bạn thành công" };
  }

  async getFriendList(userId: string) {
    const friends = await FriendRequest.find({
      $or: [{ from: userId }, { to: userId }],
      status: "accepted",
    }).populate("from to", "nickname avatarUrl");

    return friends.map((req) =>
      req.from._id.toString() === userId ? req.to : req.from
    );
  }

  async getFriendRequestList(userId: string) {
    const friends = await FriendRequest.find({
      $or: [{ to: userId }],
      status: "pending",
    }).populate("from to", "nickname avatarUrl");

    return friends.map((req) =>
      req.from._id.toString() === userId ? req.to : req.from
    );
  }

  async getRelationshipStatus(currentUserId: string, targetUserId: string) {
    const friendship = await FriendRequest.findOne({
      $or: [
        { from: currentUserId, to: targetUserId },
        { from: targetUserId, to: currentUserId },
      ],
    });

    if (!friendship) return "none";
    if (friendship.status === "accepted") return "friends";
    if (friendship.status === "pending") {
      return friendship.from.toString() === currentUserId
        ? "pending_sent"
        : "pending_received";
    }

    return friendship.status;
  }
}

export default new FriendService();
