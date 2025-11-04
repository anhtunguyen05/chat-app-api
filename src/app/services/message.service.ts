import { Message } from "../models/message.model";
import uploadService from "./upload.service";

class MessageService {
  async saveMessageToDB(
    senderId: string,
    receiverId: string | null,
    text: string,
    imageUrls: string[],
    type: string,
    groupId?: string | null
  ) {
    // ✅ Xác định loại tin nhắn
    if (!receiverId && !groupId) {
      throw new Error("Must provide either receiverId or groupId");
    }

    const messageData: any = {
      sender: senderId,
      text,
      imageUrls,
      type,
      receiver: receiverId || null,
      group: groupId || null,
    };

    const message = await Message.create(messageData);

    // ✅ Populate sender (và receiver nếu là tin 1-1)
    if (receiverId) {
      return message.populate("sender receiver", "nickname avatarUrl");
    } else {
      return message.populate("sender", "nickname avatarUrl");
    }
  }

  async getConversation(
    user1: string,
    user2: string,
    page = "1",
    limit = "20"
  ) {
    const skip = (Number(page) - 1) * Number(limit);

    return Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 },
      ],
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("sender receiver", "nickname avatarUrl");
  }

  async getGroupConversation(groupId: string, page = "1", limit = "20") {
    const skip = (Number(page) - 1) * Number(limit);

    return Message.find({ group: groupId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("sender", "nickname avatarUrl");
  }
}

export default new MessageService();
