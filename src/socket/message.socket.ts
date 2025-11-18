import { Server, Socket } from "socket.io";
import { Message } from "../app/models/message.model";
import { Group } from "../app/models/group.model";
import { Conversation } from "../app/models/conversation.model";
import messageService from "../app/services/message.service";
import uploadService from "../app/services/upload.service";
import redis from "../config/redis.config";

export function registerMessageSocket(io: Server, socket: Socket) {
  socket.on("sendMessage", async (data) => {
    try {
      const {
        senderId,
        conversationId,
        text,
        imageUrls = [],
        type = "text",
      } = data;

      // 1. Lưu DB (kiểu mới)
      const message = await messageService.saveMessageToDB({
        senderId,
        conversationId,
        text,
        imageUrls,
        type,
      });

      // 2. Lấy conversation để biết member nào cần nhận
      const conversation = await Conversation.findById(conversationId)
        .populate("participants.user", "id")
        .lean();

      if (!conversation) {
        socket.emit("error", { message: "Conversation not found" });
        return;
      }

      const members = conversation.participants.map((p: any) =>
        p.toString()
      );

      const onlineUsers = await redis.smembers("online_users");

      // 3. Gửi message đến các thành viên (trừ sender)
      for (const memberId of members) {
        if (memberId === senderId) continue;

        if (onlineUsers.includes(memberId)) {
          io.to(memberId).emit("receiveMessage", message);
        } else {
          await redis.lpush(`pending:${memberId}`, JSON.stringify(message));
        }
      }

      // 4. Gửi lại cho người gửi
      socket.emit("messageSent", message);
    } catch (err) {
      console.error("❌ sendMessage error:", err);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // socket.on("sendGroupMessage", async (data) => {
  //   try {
  //     const { senderId, groupId, text, imageUrls = [], type = "text" } = data;

  //     // ✅ 1. Lưu vào MongoDB
  //     const message = await messageService.saveMessageToDB(
  //       senderId,
  //       null,
  //       text,
  //       imageUrls,
  //       type,
  //       groupId
  //     );

  //     // ✅ 2. Lấy danh sách thành viên nhóm từ DB
  //     const group = await Group.findById(groupId).select("members").lean();

  //     if (!group) {
  //       socket.emit("error", { message: "Group not found" });
  //       return;
  //     }

  //     const members = group.members.map((m) => m.toString());
  //     const onlineUsers = await redis.smembers("online_users");

  //     // ✅ 3. Gửi đến các thành viên
  //     for (const memberId of members) {
  //       if (memberId === senderId) continue;

  //       if (onlineUsers.includes(memberId)) {
  //         io.to(memberId).emit("receiveMessage", message);
  //         console.log(`👥 Sent group message to online member ${memberId}`);
  //       } else {
  //         const pendingKey = `pending:${memberId}`;
  //         await redis.lpush(pendingKey, JSON.stringify(message));
  //         console.log(`💤 Member ${memberId} offline — saved group message`);
  //       }
  //     }

  //     // ✅ 4. Gửi phản hồi lại cho người gửi
  //     socket.emit("messageSent", message);
  //     console.log(`📢 Group ${groupId} | ${senderId}: ${text}`);
  //   } catch (err) {
  //     console.error("❌ Error sending group message:", err);
  //     socket.emit("error", { message: "Failed to send group message" });
  //   }
  // });

  socket.on("getPendingMessages", async (userId) => {
    try {
      const pendingKey = `pending:${userId}`;
      const pending = await redis.lrange(pendingKey, 0, -1);

      if (pending.length > 0) {
        const messages = pending.map((p) => JSON.parse(p));
        socket.emit("pendingMessages", messages);
        await redis.del(pendingKey);
        console.log(
          `📨 Delivered ${messages.length} pending messages to ${userId}`
        );
      }
    } catch (err) {
      console.error("❌ Failed to get pending messages:", err);
    }
  });

  socket.on("markAsRead", async (data) => {
    try {
      const { userId, chatId, isGroup } = data;

      const redisKey = isGroup
        ? `read_status:group:${chatId}`
        : `read_status:user:${chatId}`;

      // ✅ 1. Lưu trạng thái "đã đọc" vào Redis
      // -> Giúp những user khác thấy ngay mà không cần query DB
      await redis.hset(redisKey, userId, Date.now());

      // ✅ 2. Gửi sự kiện "đã đọc" cho toàn bộ user trong phòng
      io.to(chatId).emit("messageRead", { chatId, userId });

      // ✅ 3. (Tùy chọn) batch update DB định kỳ
      // -> Giúp giảm tần suất ghi DB
      await redis.lpush(
        "read_updates_queue",
        JSON.stringify({ userId, chatId, isGroup })
      );
      if (isGroup) await messageService.markGroupMessagesAsRead(userId, chatId);
      else await messageService.markMessagesAsRead(userId, chatId);
      console.log(
        `👀 ${isGroup ? "Group" : "Chat"} ${chatId}: ${userId} marked as read`
      );
    } catch (err) {
      console.error("❌ Error marking messages as read:", err);
    }
  });

  socket.on("joinGroup", (groupId) => {
    socket.join(groupId);
    console.log(`👥 User ${socket.id} joined group room ${groupId}`);
  });

  socket.on("typing", ({ senderId, receiverId, groupId }) => {
    if (groupId) {
      socket.to(groupId).emit("typing", { senderId, groupId });
    } else if (receiverId) {
      io.to(receiverId).emit("typing", { senderId });
    }
  });

  socket.on("stopTyping", ({ senderId, receiverId, groupId }) => {
    if (groupId) {
      socket.to(groupId).emit("stopTyping", { senderId, groupId });
    } else if (receiverId) {
      socket.to(receiverId).emit("stopTyping", { senderId });
    }
  });
}
