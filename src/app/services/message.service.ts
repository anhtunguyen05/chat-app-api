import { Message } from "../models/message.model";
import uploadService from "./upload.service";

class MessageService {
  async saveMessageToDB(senderId: string, receiverId: string, text: string, imageUrls: string[], type: string) {
    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      text,
      imageUrls,
      type,
    });
    return message.populate("sender receiver", "nickname avatarUrl");
  }

  async getConversation(user1: string, user2: string, page = "1", limit = "20") {

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

  
}

export default new MessageService();
