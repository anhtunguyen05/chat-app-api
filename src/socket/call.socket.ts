import { Server, Socket } from "socket.io";
import MessageService from "../app/services/message.service";

// Map để track cuộc gọi đang diễn ra
const activeCalls = new Map<string, {
  caller: string;
  receiver: string;
  callType: "voice" | "video";
  startedAt: Date;
}>();

export function registerCallSocket(io: Server, socket: Socket) {
  const userId = socket.data.userId;

  // Bắt đầu cuộc gọi
  socket.on("call:initiate", ({ to, conversationId, callType, offer }) => {
    console.log(`📞 User ${userId} is calling ${to} (${callType})`);
    
    // Lưu thông tin cuộc gọi
    const callId = `${userId}-${to}`;
    activeCalls.set(callId, {
      caller: userId,
      receiver: to,
      callType,
      startedAt: new Date(),
    });
    
    // Gửi thông báo cuộc gọi đến người nhận
    io.to(to).emit("call:incoming", {
      from: userId,
      conversationId,
      callType,
      offer,
      timestamp: new Date(),
    });
  });

  // Chấp nhận cuộc gọi
  socket.on("call:accept", async ({ to, conversationId, answer }) => {
    console.log(`✅ User ${userId} accepted call from ${to}`);
    
    const callId = `${to}-${userId}`;
    const callInfo = activeCalls.get(callId);
    
    if (callInfo) {
      // Cập nhật thời gian bắt đầu thực sự
      callInfo.startedAt = new Date();
      activeCalls.set(callId, callInfo);
    }
    
    io.to(to).emit("call:accepted", {
      from: userId,
      answer,
    });
  });

  // Từ chối cuộc gọi
  socket.on("call:reject", async ({ to, conversationId, reason }) => {
    console.log(`❌ User ${userId} rejected call from ${to}`);
    
    const callId = `${to}-${userId}`;
    const callInfo = activeCalls.get(callId);
    
    // Lưu message rejected
    if (callInfo && conversationId) {
      await MessageService.saveCallMessage({
        senderId: to,
        receiverId: userId,
        conversationId,
        callType: callInfo.callType,
        status: "rejected",
        startedAt: callInfo.startedAt,
      });
      
      // Emit để cập nhật UI
      io.to(conversationId).emit("message:new", {
        conversationId,
        type: "call",
      });
    }
    
    activeCalls.delete(callId);
    
    io.to(to).emit("call:rejected", {
      from: userId,
      reason: reason || "busy",
    });
  });

  // Kết thúc cuộc gọi
  socket.on("call:end", async ({ to, conversationId }) => {
    console.log(`📵 User ${userId} ended call with ${to}`);
    
    const callId1 = `${userId}-${to}`;
    const callId2 = `${to}-${userId}`;
    const callInfo = activeCalls.get(callId1) || activeCalls.get(callId2);
    
    if (callInfo && conversationId) {
      const endedAt = new Date();
      const duration = Math.floor((endedAt.getTime() - callInfo.startedAt.getTime()) / 1000);
      
      // Lưu message completed
      await MessageService.saveCallMessage({
        senderId: callInfo.caller,
        receiverId: callInfo.receiver,
        conversationId,
        callType: callInfo.callType,
        status: "completed",
        duration,
        startedAt: callInfo.startedAt,
        endedAt,
      });
      
      // Emit để cập nhật UI
      io.to(conversationId).emit("message:new", {
        conversationId,
        type: "call",
      });
    }
    
    activeCalls.delete(callId1);
    activeCalls.delete(callId2);
    
    io.to(to).emit("call:ended", {
      from: userId,
    });
  });

  // ICE Candidates (để thiết lập kết nối P2P)
  socket.on("call:ice-candidate", ({ to, candidate }) => {
    io.to(to).emit("call:ice-candidate", {
      from: userId,
      candidate,
    });
  });

  // Missed call (khi không trả lời)
  socket.on("call:missed", async ({ to, conversationId, callType }) => {
    console.log(`📞❌ Missed call from ${userId} to ${to}`);
    
    const callId = `${userId}-${to}`;
    const callInfo = activeCalls.get(callId);
    
    if (conversationId) {
      await MessageService.saveCallMessage({
        senderId: userId,
        receiverId: to,
        conversationId,
        callType: callType || callInfo?.callType || "voice",
        status: "missed",
        startedAt: callInfo?.startedAt || new Date(),
      });
      
      io.to(conversationId).emit("message:new", {
        conversationId,
        type: "call",
      });
    }
    
    activeCalls.delete(callId);
  });

  // Toggle camera/mic
  socket.on("call:toggle-video", ({ to, enabled }) => {
    io.to(to).emit("call:video-toggled", {
      from: userId,
      enabled,
    });
  });

  socket.on("call:toggle-audio", ({ to, enabled }) => {
    io.to(to).emit("call:audio-toggled", {
      from: userId,
      enabled,
    });
  });

  // Chuyển từ voice sang video call
  socket.on("call:upgrade-to-video", ({ to, offer }) => {
    io.to(to).emit("call:upgrade-request", {
      from: userId,
      offer,
    });
  });

  socket.on("call:upgrade-accept", ({ to, answer }) => {
    io.to(to).emit("call:upgrade-accepted", {
      from: userId,
      answer,
    });
  });
}
