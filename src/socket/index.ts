import { Server, Socket } from "socket.io";
import { registerMessageSocket } from "./message.socket";
import { registerCallSocket } from "./call.socket";
import { User } from "../app/models/user.model";
import redis from "../config/redis.config";
import {
  UserSocketEvent,
  ConversationSocketEvent,
  CommonSocketEvent,
} from "../enums/socket.enum";

let ioInstance: Server;

/**
 * Khởi tạo Socket.IO và đăng ký các module con
 */
export function initSocket(io: Server) {
  ioInstance = io;

  io.on(CommonSocketEvent.CONNECTION, (socket: Socket) => {
    console.log("🟢 User connected:", socket.id);

    // ✅ Lấy userId từ socket.data (đã verify trong middleware)
    const userId = socket.data.userId;
    if (!userId) {
      socket.disconnect();
      return;
    }

    // Khi user join phòng riêng của họ
    socket.on(UserSocketEvent.JOIN, async () => {
      socket.join(userId);
      console.log(`👤 User ${userId} joined their private room`);

      // ✅ Thêm user này vào danh sách online trong Redis
      await redis.sadd("online_users", userId);

      // ✅ Lưu socketId tương ứng userId để xử lý disconnect chính xác
      await redis.set(`socket:${socket.id}`, userId);

      // ✅ Thông báo cho toàn bộ client khác biết user này online
      socket.broadcast.emit(UserSocketEvent.USER_STATUS, { userId, isOnline: true });

      // ✅ Gửi danh sách user đang online từ Redis về client
      const onlineList = await redis.smembers("online_users");
      socket.emit(UserSocketEvent.ONLINE_LIST, onlineList);

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

    socket.on(ConversationSocketEvent.JOIN_CONVERSATION, async ({conversationId}) => {
      // TODO: Verify user có quyền join conversation này không
      socket.join(conversationId);
      console.log(`👥 User ${userId} joined conversation ${conversationId}`);
    });

    socket.on(ConversationSocketEvent.LEAVE_CONVERSATION, (conversationId: string) => {
      socket.leave(conversationId);
    });

    socket.on(ConversationSocketEvent.TYPING, ({ conversationId }) => {
      socket.to(conversationId).emit(ConversationSocketEvent.TYPING, {
        senderId: userId,
        conversationId,
      });
      console.log(`✏️ User ${userId} is typing in conversation ${conversationId}`);
    });

    socket.on(ConversationSocketEvent.STOP_TYPING, ({ conversationId }) => {
      socket.to(conversationId).emit(ConversationSocketEvent.STOP_TYPING, {
        senderId: userId,
        conversationId,
      });
    });

    // Đăng ký module message, notification, friend...
    registerMessageSocket(io, socket);
    registerCallSocket(io, socket);

    // Khi user disconnect
    socket.on(CommonSocketEvent.DISCONNECT, async () => {
      console.log("🔴 User disconnected:", socket.id);

      try {
        // Xoá socket mapping
        await redis.del(`socket:${socket.id}`);

        await redis.srem("online_users", userId);

        // Cập nhật lastSeen vào Redis + DB
        const lastSeen = new Date().toISOString();
        await redis.hset("last_seen", userId, lastSeen);

        await User.findByIdAndUpdate(userId, { lastSeen });

        // Gửi event cho toàn bộ client
        io.emit(UserSocketEvent.USER_STATUS, {
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
