import { Server, Socket } from "socket.io";
import { registerMessageSocket }from "./message.socket";

let ioInstance: Server;

/**
 * Khởi tạo Socket.IO và đăng ký các module con
 */
export function initSocket(io: Server) {
  ioInstance = io;

  io.on("connection", (socket: Socket) => {
    console.log("🟢 User connected:", socket.id);

    // Mỗi client nên join room riêng (theo userId)
    socket.on("join", (userId: string) => {
      socket.join(userId);
      console.log(`👤 User ${userId} joined their private room`);
    });

    // Đăng ký các module riêng (vd: message, notification, friend...)
    registerMessageSocket(io, socket);

    socket.on("disconnect", () => {
      console.log("🔴 User disconnected:", socket.id);
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
