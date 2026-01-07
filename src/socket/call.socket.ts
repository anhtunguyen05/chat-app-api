import { Server, Socket } from "socket.io";
import MessageService from "../app/services/message.service";
import { CallType, CallStatus } from "../enums/message.enum";
import { CallSocketEvent, MessageSocketEvent } from "../enums/socket.enum";

// Map để track cuộc gọi đang diễn ra
const activeCalls = new Map<string, {
  caller: string;
  receiver: string;
  callType: CallType;
  startedAt: Date;
}>();

export function registerCallSocket(io: Server, socket: Socket) {
  const userId = socket.data.userId;

  // Bắt đầu cuộc gọi
  socket.on(CallSocketEvent.INITIATE, ({ to, conversationId, callType, offer }) => {
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
    io.to(to).emit(CallSocketEvent.INCOMING, {
      from: userId,
      conversationId,
      callType,
      offer,
      timestamp: new Date(),
    });
  });

  // Chấp nhận cuộc gọi
  socket.on(CallSocketEvent.ACCEPT, async ({ to, conversationId, answer }) => {
    console.log(`✅ User ${userId} accepted call from ${to}`);
    
    const callId = `${to}-${userId}`;
    const callInfo = activeCalls.get(callId);
    
    if (callInfo) {
      // Cập nhật thời gian bắt đầu thực sự
      callInfo.startedAt = new Date();
      activeCalls.set(callId, callInfo);
    }
    
    io.to(to).emit(CallSocketEvent.ACCEPTED, {
      from: userId,
      answer,
    });
  });

  // Từ chối cuộc gọi
  socket.on(CallSocketEvent.REJECT, async ({ to, conversationId, reason }) => {
    console.log(`❌ User ${userId} rejected call from ${to}`);
    
    const callId = `${to}-${userId}`;
    const callInfo = activeCalls.get(callId);
    
    // Lưu message rejected
    if (callInfo && conversationId) {
      const message = await MessageService.saveCallMessage({
        senderId: to,
        receiverId: userId,
        conversationId,
        callType: callInfo.callType,
        status: CallStatus.REJECTED,
        startedAt: callInfo.startedAt,
      });
      
      // Emit message giống như sendMessage
      io.to(to).emit(MessageSocketEvent.RECEIVE_MESSAGE, message); // người gọi nhận
      io.to(userId).emit(MessageSocketEvent.MESSAGE_SENT, message); // người từ chối nhận
    }
    
    activeCalls.delete(callId);
    
    io.to(to).emit(CallSocketEvent.REJECTED, {
      from: userId,
      reason: reason || "busy",
    });
  });

  // Kết thúc cuộc gọi
  socket.on(CallSocketEvent.END, async ({ to, conversationId }) => {
    console.log(`📵 User ${userId} ended call with ${to}`);
    
    const callId1 = `${userId}-${to}`;
    const callId2 = `${to}-${userId}`;
    const callInfo = activeCalls.get(callId1) || activeCalls.get(callId2);
    
    if (callInfo && conversationId) {
      const endedAt = new Date();
      const duration = Math.floor((endedAt.getTime() - callInfo.startedAt.getTime()) / 1000);
      
      // Lưu message completed
      const message = await MessageService.saveCallMessage({
        senderId: callInfo.caller,
        receiverId: callInfo.receiver,
        conversationId,
        callType: callInfo.callType,
        status: CallStatus.COMPLETED,
        duration,
        startedAt: callInfo.startedAt,
        endedAt,
      });
      
      // Emit message cho cả 2 người
      io.to(callInfo.caller).emit(MessageSocketEvent.MESSAGE_SENT, message);
      io.to(callInfo.receiver).emit(MessageSocketEvent.RECEIVE_MESSAGE, message);
    }
    
    activeCalls.delete(callId1);
    activeCalls.delete(callId2);
    
    io.to(to).emit(CallSocketEvent.ENDED, {
      from: userId,
    });
  });

  // ICE Candidates (để thiết lập kết nối P2P)
  socket.on(CallSocketEvent.ICE_CANDIDATE, ({ to, candidate }) => {
    io.to(to).emit(CallSocketEvent.ICE_CANDIDATE, {
      from: userId,
      candidate,
    });
  });

  // Missed call (khi không trả lời)
  socket.on(CallSocketEvent.MISSED, async ({ to, conversationId, callType }) => {
    console.log(`📞❌ Missed call from ${userId} to ${to}`);
    
    const callId = `${userId}-${to}`;
    const callInfo = activeCalls.get(callId);
    
    if (conversationId) {
      const message = await MessageService.saveCallMessage({
        senderId: userId,
        receiverId: to,
        conversationId,
        callType: callType || callInfo?.callType || CallType.VOICE,
        status: CallStatus.MISSED,
        startedAt: callInfo?.startedAt || new Date(),
      });
      
      // Emit message cho cả 2 người
      io.to(userId).emit(MessageSocketEvent.MESSAGE_SENT, message); // người gọi
      io.to(to).emit(MessageSocketEvent.RECEIVE_MESSAGE, message); // người bị nhỡ
    }
    
    activeCalls.delete(callId);
  });

  // Toggle camera/mic
  socket.on(CallSocketEvent.TOGGLE_VIDEO, ({ to, enabled }) => {
    io.to(to).emit(CallSocketEvent.VIDEO_TOGGLED, {
      from: userId,
      enabled,
    });
  });

  socket.on(CallSocketEvent.TOGGLE_AUDIO, ({ to, enabled }) => {
    io.to(to).emit(CallSocketEvent.AUDIO_TOGGLED, {
      from: userId,
      enabled,
    });
  });

  // Chuyển từ voice sang video call
  socket.on(CallSocketEvent.UPGRADE_TO_VIDEO, ({ to, offer }) => {
    io.to(to).emit(CallSocketEvent.UPGRADE_REQUEST, {
      from: userId,
      offer,
    });
  });

  socket.on(CallSocketEvent.UPGRADE_ACCEPT, ({ to, answer }) => {
    io.to(to).emit(CallSocketEvent.UPGRADE_ACCEPTED, {
      from: userId,
      answer,
    });
  });
}
