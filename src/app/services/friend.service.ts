import { Types } from "mongoose";
import { User } from "../models/user.model";
import { Conversation } from "../models/conversation.model";
import { ConversationParticipant } from "../models/conversationParticipant.model";
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

  // 1. Cập nhật trạng thái
  request.status = "accepted";
  await request.save();

  // 2. Kiểm tra xem conversation 1-1 đã tồn tại chưa
  let conversation = await Conversation.findOne({
    type: "private",
    participants: { $all: [fromId, toId] },
  });

  // 3. Nếu chưa tồn tại → tạo mới conversation
  if (!conversation) {
    conversation = await Conversation.create({
      type: "private",
      participants: [fromId, toId],
    });

    // Tạo participants cho cả 2 user
    await ConversationParticipant.create([
      {
        conversation: conversation._id,
        user: fromId,
        role: "member",
      },
      {
        conversation: conversation._id,
        user: toId,
        role: "member",
      },
    ]);
  }

  // 4. Có thể trả cả conversation nếu FE cần
  return {
    request,
    conversationId: conversation._id,
  };
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
    }).populate("from to", "nickname avatarUrl slug lastSeen");

    return friends.map((req) =>
      req.from._id.toString() === userId ? req.to : req.from
    );
  }

  async getNoneFriendList(userId: string) {
    // 1️⃣ Tìm các lời mời bạn bè đã chấp nhận (tức là bạn bè thật sự)
    const friends = await FriendRequest.find({
      $or: [{ from: userId }, { to: userId }],
    });

    // 2️⃣ Lấy danh sách ID bạn bè
    const friendIds = friends.map((req) =>
      req.from.toString() === userId ? req.to.toString() : req.from.toString()
    );

    // 3️⃣ Loại bỏ cả user hiện tại khỏi danh sách
    friendIds.push(userId);

    // 4️⃣ Tìm những user KHÔNG nằm trong danh sách friendIds
    const nonFriends = await User.find({
      _id: { $nin: friendIds },
    }).select("nickname avatarUrl slug lastSeen");

    return nonFriends;
  }

  async getFriendRequestList(userId: string) {
    const friends = await FriendRequest.find({
      $or: [{ to: userId }],
      status: "pending",
    }).populate("from to", "nickname slug avatarUrl");

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
