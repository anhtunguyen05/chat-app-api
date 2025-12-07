export enum MessageType {
  TEXT = "text",
  STICKER = "sticker",
  IMAGE = "image",
  VIDEO = "video",
  MIXED = "mixed",
  CALL = "call",
}

export enum CallType {
  VOICE = "voice",
  VIDEO = "video",
}

export enum CallStatus {
  MISSED = "missed",
  REJECTED = "rejected",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum ConversationType {
  PRIVATE = "private",
  GROUP = "group",
}

export enum ParticipantRole {
  MEMBER = "member",
  ADMIN = "admin",
}

export enum FriendRequestStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
}
