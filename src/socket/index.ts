import { Server, Socket } from "socket.io";
import { registerMessageSocket } from "./message.socket";
import { User } from "../app/models/user.model";
import redis from "../config/redis.config";

let ioInstance: Server;

/**
 * Khởi tạo Socket.IO và đăng ký các module con
 */
export function initSocket(io: Server) {
  ioInstance = io;

  io.on("connection", (socket: Socket) => {
    console.log("🟢 User connected:", socket.id);

    // Khi user join phòng riêng của họ
    socket.on("join", async (data) => {
      const { userId } = data;
      if (!userId) return;

      socket.join(userId);
      console.log(`👤 User ${userId} joined their private room`);

      // ✅ Thêm user này vào danh sách online trong Redis
      await redis.sadd("online_users", userId);

      // ✅ Lưu socketId tương ứng userId để xử lý disconnect chính xác
      await redis.set(`socket:${socket.id}`, userId);

      // ✅ Thông báo cho toàn bộ client khác biết user này online
      socket.broadcast.emit("userStatus", { userId, isOnline: true });

      // ✅ Gửi danh sách user đang online từ Redis về client
      const onlineList = await redis.smembers("online_users");
      socket.emit("onlineList", onlineList);

      // ✅ Kiểm tra và gửi các tin nhắn pending (nếu có)
      const pending = await redis.lrange(`pending:${userId}`, 0, -1);

      if (pending.length > 0) {
        const messages = pending.map((msgStr) => JSON.parse(msgStr));

        socket.emit("pendingMessages", messages);

        // Xóa pending
        await redis.del(`pending:${userId}`);
      }
      console.log("✅ User online:", userId);
    });

    socket.on("joinConversation", async ({conversationId}) => {
      socket.join(conversationId);
      console.log(`👥 Socket ${socket.id} joined conversation ${conversationId}`);
    });

    socket.on("leaveConversation", (conversationId: string) => {
      socket.leave(conversationId);
    });

    socket.on("typing", ({ senderId, conversationId }) => {
      socket.to(conversationId).emit("typing", {
        senderId,
        conversationId,
      });
      console.log(`✏️ User ${senderId} is typing in conversation ${conversationId}`);
    });

    socket.on("stopTyping", ({ senderId, conversationId }) => {
      socket.to(conversationId).emit("stopTyping", {
        senderId,
        conversationId,
      });
    });

    // Đăng ký module message, notification, friend...
    registerMessageSocket(io, socket);

    // Khi user disconnect
    socket.on("disconnect", async () => {
      console.log("🔴 User disconnected:", socket.id);

      try {
        // Lấy userId từ socketId
        const userId = await redis.get(`socket:${socket.id}`);
        if (!userId) return;

        // Xoá socket mapping
        await redis.del(`socket:${socket.id}`);

        await redis.srem("online_users", userId);

        // Cập nhật lastSeen vào Redis + DB
        const lastSeen = new Date().toISOString();
        await redis.hset("last_seen", userId, lastSeen);

        await User.findByIdAndUpdate(userId, { lastSeen });

        // Gửi event cho toàn bộ client
        io.emit("userStatus", {
          userId,
          isOnline: false,
          lastSeen,
        });

        console.log(`🕒 Updated lastSeen for user ${userId}`);
      } catch (error) {
        console.error("❌ Error handling disconnect:", error);
      }
    });
  });
}

/**
 * Cho phép lấy io ở bất kỳ đâu (vd: trong controller)
 */
export function getIO() {
  if (!ioInstance) {
    throw new Error("❌ Socket.IO chưa được khởi tạo");
  }
  return ioInstance;
}
