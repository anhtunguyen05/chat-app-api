import mongoose, { Schema, Document } from "mongoose";
import { CallType, CallStatus } from "../../enums/message.enum";

export interface ICall extends Document {
  caller: mongoose.Types.ObjectId; // người gọi
  receiver: mongoose.Types.ObjectId; // người nhận
  conversationId?: mongoose.Types.ObjectId; // cuộc hội thoại liên quan
  callType: CallType;
  status: CallStatus;
  duration?: number; // thời gian cuộc gọi (giây)
  startedAt?: Date;
  endedAt?: Date;
  createdAt: Date;
}

const CallSchema = new Schema<ICall>(
  {
    caller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: Schema.Types.ObjectId, ref: "User", required: true },
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation" },
    callType: { type: String, enum: Object.values(CallType), required: true },
    status: {
      type: String,
      enum: Object.values(CallStatus),
      required: true,
    },
    duration: { type: Number }, // seconds
    startedAt: { type: Date },
    endedAt: { type: Date },
  },
  { timestamps: true }
);

export const Call = mongoose.model<ICall>("Call", CallSchema);
