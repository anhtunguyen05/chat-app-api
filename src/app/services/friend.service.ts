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

  async acceptFriendRequest(requestId: string) {
    const request = await FriendRequest.findById(requestId);
    if (!request) throw new Error("Không tìm thấy yêu cầu kết bạn");

    request.status = "accepted";
    await request.save();

    // ✅ Sau này có thể thêm logic thêm bạn vào danh sách friends của cả 2 users
    return request;
  }

  async getFriendList(userId: string) {
    const friends = await FriendRequest.find({
      $or: [{ from: userId }, { to: userId }],
      status: "accepted",
    })
      .populate("from to", "nickname avatarUrl")
      .lean();

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
}

export default new FriendService();
