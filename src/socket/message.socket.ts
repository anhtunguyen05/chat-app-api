import { Server, Socket } from "socket.io";
import { Message } from "../app/models/message.model";
import messageService from "../app/services/message.service";
import uploadService from "../app/services/upload.service";
import redis from "../config/redis.config";

export function registerMessageSocket(io: Server, socket: Socket) {
  socket.on("sendMessage", async (data) => {
    try {
      const {
        senderId,
        receiverId,
        text,
        imageUrls = [],
        type = "text",
      } = data;

      // ✅ 1. Lưu vào MongoDB
      const message = await messageService.saveMessageToDB(
        senderId,
        receiverId,
        text,
        imageUrls,
        type
      );

      // ✅ 2. Kiểm tra người nhận có online không
      const onlineUsers = await redis.smembers("online_users");
      const isOnline = onlineUsers.includes(receiverId);

      if (isOnline) {
        // 👉 Online → gửi ngay
        io.to(receiverId).emit("receiveMessage", message);
        console.log(`💬 Message sent to online user ${receiverId}`);
      } else {
        // 👉 Offline → lưu pending
        const pendingKey = `pending:${receiverId}`;
        await redis.lpush(pendingKey, JSON.stringify(message));
        console.log(`💤 User ${receiverId} offline — saved to Redis`);
      }

      // ✅ 3. Phản hồi lại cho người gửi
      socket.emit("messageSent", message);
    } catch (err) {
      console.error("❌ Error sending message:", err);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  socket.on("sendGroupMessage", async (data) => {
    try {
      const {
        senderId,
        groupId,
        text,
        imageUrls = [],
        type = "text",
        members,
      } = data;

      // ✅ 1. Lưu vào MongoDB
      const message = await messageService.saveMessageToDB(
        senderId,
        null,
        text,
        imageUrls,
        type,
        groupId
      );

      // ✅ 2. Gửi đến tất cả thành viên online
      const onlineUsers = await redis.smembers("online_users");

      for (const memberId of members) {
        if (memberId === senderId) continue; // bỏ qua người gửi

        if (onlineUsers.includes(memberId)) {
          io.to(memberId).emit("receiveMessage", message);
          console.log(`👥 Sent group message to online member ${memberId}`);
        } else {
          // ✅ 3. Nếu offline → lưu tin nhắn pending riêng từng user
          const pendingKey = `pending:${memberId}`;
          await redis.lpush(pendingKey, JSON.stringify(message));
          console.log(`💤 Member ${memberId} offline — saved group message`);
        }
      }

      // ✅ 4. Gửi phản hồi lại cho người gửi để cập nhật UI
      socket.emit("messageSent", message);
      console.log(`📢 Group ${groupId} | ${senderId}: ${text}`);
    } catch (err) {
      console.error("❌ Error sending group message:", err);
      socket.emit("error", { message: "Failed to send group message" });
    }
  });

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
    await redis.lpush("read_updates_queue", JSON.stringify({ userId, chatId, isGroup }));

    console.log(`👀 ${isGroup ? "Group" : "Chat"} ${chatId}: ${userId} marked as read`);
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
