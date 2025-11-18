import { Types } from "mongoose";
import { User } from "../models/user.model";
import { Conversation, IConversation } from "../models/conversation.model";
import { ConversationParticipant } from "../models/conversationParticipant.model";
import { Message } from "../models/message.model";

class ConversationService {
  async getSidebarConversations(userId: string) {
  const myConversations = await ConversationParticipant.find({
    user: userId,
  })
    .populate({
      path: "conversation",
      populate: [{ path: "lastMessage" }, { path: "group" }],
    })
    .lean();

  const result: any[] = [];

  for (const cp of myConversations) {
    const conv: any = cp.conversation;
    if (!conv) continue;

    let displayName: string | undefined = "";
    let avatar = "";
    let isOnline = false;
    let lastActiveAt = null;

    if (conv.type === "private") {
      const other = await User.findOne({
        _id: { $in: conv.participants, $ne: userId },
      }).select("nickname avatarUrl isOnline lastSeen");

      displayName = other?.nickname;
      avatar = other?.avatarUrl || "";
      isOnline = other?.online || false;
      lastActiveAt = other?.lastSeen || null;
    }

    if (conv.type === "group") {
      displayName = conv.group?.name;
      avatar = conv.group?.avatarUrl;
    }

    const isLastMessageRead =
      cp.lastSeenMessage &&
      conv.lastMessage &&
      cp.lastSeenMessage.toString() === conv.lastMessage._id.toString();

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

  result.sort(
    (a, b) =>
      new Date(b.lastMessageAt || 0).getTime() -
      new Date(a.lastMessageAt || 0).getTime()
  );

  return result;
}

}

export default new ConversationService();
