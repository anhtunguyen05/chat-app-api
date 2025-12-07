import { Schema, model, Document, Types } from "mongoose";
import { MessageType, CallType, CallStatus } from "../../enums/message.enum";

export interface IMessage {
  sender: Types.ObjectId;
  receiver?: Types.ObjectId | null; // 1-1
  group?: Types.ObjectId | null; // group
  conversation: Types.ObjectId;

  text: string;
  imageUrls?: string[];
  type: MessageType;

  isRead: boolean; // cho chat 1-1
  readBy: Types.ObjectId[]; // danh sách đã đọc (group)

  // Call metadata (chỉ dùng khi type = "call")
  callData?: {
    callType: CallType;
    status: CallStatus;
    duration?: number; // seconds
    startedAt?: Date;
    endedAt?: Date;
  };

  createdAt: Date;
}

export interface IMessageDocument extends IMessage, Document {}

const messageSchema = new Schema<IMessageDocument>(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: Schema.Types.ObjectId, ref: "User", default: null },
    group: { type: Schema.Types.ObjectId, ref: "Group", default: null },
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },

    text: { type: String },
    imageUrls: [{ type: String }],

    type: {
      type: String,
      enum: Object.values(MessageType),
      default: MessageType.TEXT,
    },

    // Call metadata
    callData: {
      callType: { type: String, enum: Object.values(CallType) },
      status: {
        type: String,
        enum: Object.values(CallStatus),
      },
      duration: { type: Number },
      startedAt: { type: Date },
      endedAt: { type: Date },
    },

    isRead: { type: Boolean, default: false },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

messageSchema.set("toJSON", {
  transform: function (doc, ret: any) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Message = model<IMessageDocument>("Message", messageSchema);
