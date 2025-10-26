import { Server, Socket } from "socket.io";
import { Message } from "../app/models/message.model";
import messageService from "../app/services/message.service";

/**
 * Xử lý các sự kiện chat realtime
 */
export function registerMessageSocket(io: Server, socket: Socket) {
  // Khi client gửi tin nhắn
  socket.on("sendMessage", async (data) => {
    try {
      const { senderId, receiverId, text } = data;
      console.log(senderId, receiverId, text);
      // ✅ Lưu tin nhắn vào DB
      const message = await messageService.saveMessageToDB(
        senderId,
        receiverId,
        text
      );

      // ✅ Gửi tin nhắn tới người nhận (room theo receiverId)
      io.to(receiverId).emit("receiveMessage", message);

      // ✅ Gửi phản hồi lại cho người gửi để update UI
      socket.emit("messageSent", message);

      console.log(`💬 Message from ${senderId} → ${receiverId}: ${text}`);
    } catch (err) {
      console.error("❌ Error when sending message:", err);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // (tùy chọn) Sự kiện user đang nhập
  socket.on("typing", ({ senderId, receiverId }) => {
    io.to(receiverId).emit("typing", { senderId });
  });

  socket.on("stopTyping", ({ senderId, receiverId }) => {
    socket.to(receiverId).emit("stopTyping", { senderId });
  });
}
