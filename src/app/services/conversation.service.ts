import { Types } from "mongoose";
import { User } from "../models/user.model";
import { Conversation, IConversation } from "../models/conversation.model";
import { ConversationParticipant } from "../models/conversationParticipant.model";
import { Message } from "../models/message.model";

interface CreateGroupDTO {
  name: string;
  avatar?: string;
  creatorId: string;
  memberIds: string[]; // bao gồm cả người tạo nhóm
}

class ConversationService {
  async getSidebarConversations(userId: string) {
    const myConversations = await ConversationParticipant.find({
      user: userId,
    })
      .populate({
        path: "conversation",
        populate: [{ path: "lastMessage" }],
      })
      .lean();

    const result: any[] = [];

    for (const cp of myConversations) {
      const conv: any = cp.conversation;
      if (!conv) continue;

      let displayName = "";
      let avatar = "";
      let isOnline = false;
      let lastActiveAt = null;

      if (conv.type === "private") {
        const otherUser = await User.findOne({
          _id: { $in: conv.participants, $ne: userId },
        }).select("nickname avatarUrl online lastSeen");

        displayName = otherUser?.nickname || "Unknown";
        avatar = otherUser?.avatarUrl || "";
        isOnline = otherUser?.online || false;
        lastActiveAt = otherUser?.lastSeen || null;
      }

      if (conv.type === "group") {
        displayName = conv.name || "Nhóm không tên";
        avatar = conv.avatar || "/default-group-avatar.png";
      }

      let isLastMessageRead = false;
      if (conv.lastMessage && cp.lastSeenMessage) {
        isLastMessageRead =
          cp.lastSeenMessage.toString() === conv.lastMessage._id.toString();
      }

      result.push({
        id: conv._id,
        type: conv.type,
        name: displayName,
        avatar,
        lastMessage: conv.lastMessage?.text || null,
        lastMessageAt: conv.lastMessage?.createdAt || null,
        isLastMessageRead,
        isOnline,
        lastSeen: lastActiveAt,
      });
    }

    // Sort theo thời gian last message
    result.sort(
      (a, b) =>
        new Date(b.lastMessageAt || 0).getTime() -
        new Date(a.lastMessageAt || 0).getTime()
    );

    return result;
  }

  async getConversationParticipants(conversationId: string) {
    const participants = await ConversationParticipant.find({
      conversation: conversationId,
    })
      .populate("user", "nickname avatarUrl") // lấy user info
      .lean();

    // Chuẩn hóa format trả về cho FE
    return participants.map((p: any) => ({
      id: p.user._id.toString(),
      nickname: p.user.nickname,
      avatarUrl: p.user.avatarUrl,
      role: p.role,
      lastSeenMessageId: p.lastSeenMessage ? p.lastSeenMessage.toString() : null,
    }));
  }

  async createGroupChat(data: CreateGroupDTO) {
    const { name, avatar, creatorId, memberIds } = data;

    const participants = Array.from(new Set([creatorId, ...memberIds])).map(
      (id) => new Types.ObjectId(id)
    );

    const finalAvatar = avatar || "/group-default.jpg";

    // 1. Tạo conversation group
    const conversation = await Conversation.create({
      type: "group",
      name,
      avatar: finalAvatar,
      participants,
    });

    // 2. Tạo ConversationParticipant cho từng member
    const participantDocs = participants.map((userId) => ({
      conversation: conversation._id,
      user: userId,
      lastSeenMessage: null,
    }));

    await ConversationParticipant.insertMany(participantDocs);

    return conversation;
  }

  async addMembersToGroup(conversationId: string, userIds: string[]) {
    const conv = await Conversation.findById(conversationId);

    if (!conv) throw new Error("Conversation not found");
    if (conv.type !== "group") throw new Error("Not a group chat");

    const newMembers = userIds.map((id) => new Types.ObjectId(id));

    // Gộp members + remove duplicates
    const unique = new Set([
      ...conv.participants.map((p) => p.toString()),
      ...newMembers.map((p) => p.toString()),
    ]);

    conv.participants = Array.from(unique).map((id) => new Types.ObjectId(id));

    await conv.save();

    return Conversation.findById(conversationId).populate(
      "participants",
      "nickname avatarUrl isOnline lastSeen"
    );
  }

  async removeMemberFromGroup(conversationId: string, userId: string) {
    const conv = await Conversation.findById(conversationId);

    if (!conv) throw new Error("Conversation not found");
    if (conv.type !== "group") throw new Error("Not a group chat");

    conv.participants = conv.participants.filter(
      (p) => p.toString() !== userId
    );

    await conv.save();

    return Conversation.findById(conversationId).populate(
      "participants",
      "nickname avatarUrl isOnline lastSeen"
    );
  }

  async getGroupMembers(conversationId: string) {
    const conv = await Conversation.findById(conversationId).populate(
      "participants",
      "nickname avatarUrl isOnline lastSeen"
    );

    if (!conv) throw new Error("Conversation not found");
    if (conv.type !== "group") throw new Error("Not a group chat");

    return conv.participants;
  }
}

export default new ConversationService();
