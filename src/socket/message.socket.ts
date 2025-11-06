import { Server, Socket } from "socket.io";
import { Message } from "../app/models/message.model";
import messageService from "../app/services/message.service";
import uploadService from "../app/services/upload.service";

/**
 * Xử lý các sự kiện chat realtime
 */
export function registerMessageSocket(io: Server, socket: Socket) {
  // Khi client gửi tin nhắn
  socket.on("sendMessage", async (data) => {
    try {
      const {
        senderId,
        receiverId,
        text,
        imageUrls = [],
        type = "text",
      } = data;

      const message = await messageService.saveMessageToDB(
        senderId,
        receiverId,
        text,
        imageUrls,
        type
      );

      // ✅ Gửi tin nhắn đến người nhận
      io.to(receiverId).emit("receiveMessage", message);

      // ✅ Gửi phản hồi lại cho người gửi để update UI
      socket.emit("messageSent", message);

      console.log(
        `💬 Message from ${senderId} → ${receiverId}: ${text || "[images]"}`
      );
    } catch (err) {
      console.error("❌ Error when sending message:", err);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  socket.on("sendGroupMessage", async (data) => {
    try {
      const { senderId, groupId, text, imageUrls = [], type = "text" } = data;

      const message = await messageService.saveMessageToDB(
        senderId,
        null,
        text,
        imageUrls,
        type,
        groupId
      );

      // Emit đến toàn bộ thành viên trong group (phải join vào room groupId)
      io.to(groupId).emit("receiveMessage", message);

      socket.emit("messageSent", message);
      console.log(`👥 Group ${groupId} | ${senderId}: ${text}`);
    } catch (err) {
      console.error("❌ Error sending group message:", err);
      socket.emit("error", { message: "Failed to send group message" });
    }
  });

  // 🔹 Khi user join vào nhóm
  socket.on("joinGroup", (groupId) => {
    socket.join(groupId);
    console.log(`👥 User ${socket.id} joined group room ${groupId}`);
  });

  // (tùy chọn) Sự kiện user đang nhập
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
