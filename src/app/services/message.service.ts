import mongoose from "mongoose";
import { Conversation } from "../models/conversation.model";
import { ConversationParticipant } from "../models/conversationParticipant.model";
import { Message } from "../models/message.model";
import { Group } from "../models/group.model";
import uploadService from "./upload.service";

class MessageService {
  async saveMessageToDB({
    senderId,
    conversationId,
    text,
    imageUrls,
    type,
  }: {
    senderId: string;
    conversationId: string | null;
    text: string;
    imageUrls: string[];
    type: "text" | "image" | "file";
  }) {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Tạo message
    const message = await Message.create({
      sender: senderId,
      conversation: conversationId,
      text,
      imageUrls,
      type,
      createdAt: new Date(),
    });

    // Cập nhật lastMessage
    conversation.lastMessage = message.id;
    await conversation.save();

    // Cập nhật lastSeenMessage của sender
    await ConversationParticipant.findOneAndUpdate(
      { conversation: conversationId, user: senderId },
      { lastSeenMessage: message.id }
    );

    // Trả về message có populate
    return message.populate("sender", "nickname avatarUrl");
  }

  async markAsRead(userId: string, conversationId: string) {
    const lastMessage = await Message.findOne({
      conversation: conversationId,
    }).sort({ createdAt: -1 });

    if (!lastMessage) return;

    await ConversationParticipant.updateOne(
      { user: userId, conversation: conversationId },
      { lastSeenMessage: lastMessage._id }
    );
  }

  async markGroupAsRead(userId: string, conversationId: string) {
    const lastMessage = await Message.findOne({
      conversation: conversationId,
    }).sort({ createdAt: -1 });

    if (!lastMessage) return;

    await ConversationParticipant.updateOne(
      { user: userId, conversation: conversationId },
      { lastSeenMessage: lastMessage._id }
    );
  }

  async getMessages(conversationId: string, page = "1", limit = "20") {
    const skip = (Number(page) - 1) * Number(limit);

    return Message.find({ conversation: conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("sender", "nickname avatarUrl")
      .populate("receiver", "nickname avatarUrl");
  }
}

export default new MessageService();
