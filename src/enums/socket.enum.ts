// Socket events cho user/connection
export enum UserSocketEvent {
  JOIN = "join",
  USER_STATUS = "userStatus",
  ONLINE_LIST = "onlineList",
}

// Socket events cho conversation
export enum ConversationSocketEvent {
  JOIN_CONVERSATION = "conversation:join",
  LEAVE_CONVERSATION = "conversation:leave",
  TYPING = "conversation:typing",
  STOP_TYPING = "conversation:stop-typing",
}

// Socket events cho message
export enum MessageSocketEvent {
  SEND_MESSAGE = "message:send",
  RECEIVE_MESSAGE = "message:receive",
  MESSAGE_SENT = "message:sent",
  PENDING_MESSAGES = "message:pending",
  GET_PENDING_MESSAGES = "message:get-pending",
  MARK_AS_READ = "message:mark-as-read",
  MESSAGE_READ = "message:read",
}

// Socket events cho call
export enum CallSocketEvent {
  // Initiate & Accept
  INITIATE = "call:initiate",
  INCOMING = "call:incoming",
  ACCEPT = "call:accept",
  ACCEPTED = "call:accepted",
  
  // Reject & End
  REJECT = "call:reject",
  REJECTED = "call:rejected",
  END = "call:end",
  ENDED = "call:ended",
  MISSED = "call:missed",
  
  // WebRTC
  ICE_CANDIDATE = "call:ice-candidate",
  
  // Controls
  TOGGLE_VIDEO = "call:toggle-video",
  VIDEO_TOGGLED = "call:video-toggled",
  TOGGLE_AUDIO = "call:toggle-audio",
  AUDIO_TOGGLED = "call:audio-toggled",
  
  // Upgrade
  UPGRADE_TO_VIDEO = "call:upgrade-to-video",
  UPGRADE_REQUEST = "call:upgrade-request",
  UPGRADE_ACCEPT = "call:upgrade-accept",
  UPGRADE_ACCEPTED = "call:upgrade-accepted",
}

// Socket events chung
export enum CommonSocketEvent {
  CONNECTION = "connection",
  DISCONNECT = "disconnect",
  ERROR = "error",
}
