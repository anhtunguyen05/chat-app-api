import { Server, Socket } from "socket.io";
import { registerMessageSocket } from "./message.socket";
import { User } from "../app/models/user.model";

let ioInstance: Server;

/**
 * Khởi tạo Socket.IO và đăng ký các module con
 */

const onlineUsers = new Map(); // userId -> socketId
const lastSeenMap = new Map(); // userId -> Date

export function initSocket(io: Server) {
  ioInstance = io;

  io.on("connection", (socket: Socket) => {
    console.log("🟢 User connected:", socket.id);

    // Mỗi client nên join room riêng (theo userId)
    socket.on("join", (data) => {
      const { userId } = data;
      socket.join(userId);
      console.log(`👤 User ${userId} joined their private room`);
    });

    socket.on("userOnline", (userId) => {
      onlineUsers.set(userId, socket.id);
      console.log("✅ User online:", userId);

      // ✅ Gửi cho toàn bộ người khác biết user này online
      socket.broadcast.emit("userStatus", { userId, isOnline: true });

      // ✅ Gửi lại toàn bộ danh sách đang online cho user vừa kết nối
      const allOnline = Array.from(onlineUsers.keys());
      socket.emit("onlineList", allOnline);
    });

    // Đăng ký các module riêng (vd: message, notification, friend...)
    registerMessageSocket(io, socket);

    socket.on("disconnect", async () => {
      console.log("🔴 User disconnected:", socket.id);

      const userId = [...onlineUsers.entries()].find(
        ([, id]) => id === socket.id
      )?.[0];

      if (userId) {
        onlineUsers.delete(userId);
        lastSeenMap.set(userId, new Date());
        io.emit("userStatus", {
          userId,
          isOnline: false,
          lastSeen: lastSeenMap.get(userId),
        });
      }
     
      try {
        const updatedUser = await User.findByIdAndUpdate(
          userId,
          { lastSeen: new Date() },
          { new: true }
        );

        if (updatedUser) {
          console.log(`Updated lastSeen for user ${userId}`);
        } else {
          console.log(`User ${userId} not found in database`);
        }
      } catch (error) {
        console.error("Failed to update lastSeen:", error);
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
