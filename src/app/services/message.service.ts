import { Message } from "../models/message.model";

class MessageService {
    
async saveMessageToDB(senderId: string, receiverId: string, text: string) {
  const message = await Message.create({
    sender: senderId,
    receiver: receiverId,
    text
  });
  return message.populate("sender receiver", "nickname avatarUrl");
}


async getConversation(user1: string, user2: string) {
  return Message.find({
    $or: [
      { sender: user1, receiver: user2 },
      { sender: user2, receiver: user1 },
    ],
  })
    .sort({ createdAt: 1 })
    .populate("sender receiver", "nickname avatarUrl");
}

}

export default new MessageService();

