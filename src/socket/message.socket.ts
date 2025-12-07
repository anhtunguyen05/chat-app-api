import { Server, Socket } from "socket.io";
import { Message } from "../app/models/message.model";
import { Group } from "../app/models/group.model";
import { Conversation } from "../app/models/conversation.model";
import { ConversationParticipant } from "../app/models/conversationParticipant.model";
import messageService from "../app/services/message.service";
import uploadService from "../app/services/upload.service";
import redis from "../config/redis.config";
import { MessageSocketEvent, CommonSocketEvent } from "../enums/socket.enum";

export function registerMessageSocket(io: Server, socket: Socket) {
  socket.on(MessageSocketEvent.SEND_MESSAGE, async (data) => {
    try {
      const {
        senderId,
        conversationId,
        text,
        imageUrls = [],
        type = "text",
      } = data;

      // 1. Lưu DB
      const message = await messageService.saveMessageToDB({
        senderId,
        conversationId,
        text,
        imageUrls,
        type,
      });

      // 2. Lấy danh sách participant
      const conversation = await Conversation.findById(conversationId).lean();

      if (!conversation) {
        socket.emit(CommonSocketEvent.ERROR, { message: "Conversation not found" });
        return;
      }

      const members = conversation.participants.map((id) => id.toString());

      // 3. Lấy danh sách online từ Redis
      const onlineUsers = await redis.smembers("online_users");

      // 4. Emit — Hybrid
      for (const memberId of members) {
        if (memberId === senderId) continue;

        const isOnline = onlineUsers.includes(memberId);

        if (isOnline) {
          // Emit theo userId
          io.to(memberId).emit(MessageSocketEvent.RECEIVE_MESSAGE, message);

          // Emit vào room nếu họ đang mở conversation
          // io.to(conversationId).emit(MessageSocketEvent.RECEIVE_MESSAGE, message);
        } else {
          // Lưu vào pending tin nhắn
          await redis.lpush(`pending:${memberId}`, JSON.stringify(message));
        }
      }

      // 5. Trả kết quả lại cho sender
      socket.emit(MessageSocketEvent.MESSAGE_SENT, message);
    } catch (err) {
      console.error("❌ sendMessage error:", err);
      socket.emit(CommonSocketEvent.ERROR, { message: "Failed to send message" });
    }
  });

  socket.on(MessageSocketEvent.GET_PENDING_MESSAGES, async (userId) => {
    try {
      const pendingKey = `pending:${userId}`;
      const pending = await redis.lrange(pendingKey, 0, -1);

      if (pending.length > 0) {
        const messages = pending.map((p) => JSON.parse(p));
        socket.emit(MessageSocketEvent.PENDING_MESSAGES, messages);
        await redis.del(pendingKey);
        console.log(
          `📨 Delivered ${messages.length} pending messages to ${userId}`
        );
      }
    } catch (err) {
      console.error("❌ Failed to get pending messages:", err);
    }
  });

  socket.on(MessageSocketEvent.MARK_AS_READ, async (data) => {
    try {
      const { userId, conversationId } = data;

      // 1️⃣ Lấy last message của conversation
      const lastMessage = await Message.findOne({
        conversation: conversationId,
      })
        .sort({ createdAt: -1 })
        .select("_id");

      if (!lastMessage) return;

      // 2️⃣ Cập nhật ConversationParticipant.lastSeenMessage
      await ConversationParticipant.updateOne(
        { user: userId, conversation: conversationId },
        { lastSeenMessage: lastMessage._id }
      );

      // 3️⃣ Gửi realtime cho toàn bộ user trong room conversationId
      io.to(conversationId).emit(MessageSocketEvent.MESSAGE_READ, {
        conversationId,
        userId,
        lastSeenMessage: lastMessage._id,
      });

      console.log(
        `👁️ User ${userId} marked conversation ${conversationId} as read`
      );
    } catch (err) {
      console.error("❌ Error markAsRead:", err);
    }
  });
}
