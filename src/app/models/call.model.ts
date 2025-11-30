import mongoose, { Schema, Document } from "mongoose";

export interface ICall extends Document {
  caller: mongoose.Types.ObjectId; // người gọi
  receiver: mongoose.Types.ObjectId; // người nhận
  conversationId?: mongoose.Types.ObjectId; // cuộc hội thoại liên quan
  callType: "voice" | "video";
  status: "missed" | "rejected" | "completed" | "cancelled";
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
    callType: { type: String, enum: ["voice", "video"], required: true },
    status: {
      type: String,
      enum: ["missed", "rejected", "completed", "cancelled"],
      required: true,
    },
    duration: { type: Number }, // seconds
    startedAt: { type: Date },
    endedAt: { type: Date },
  },
  { timestamps: true }
);

export const Call = mongoose.model<ICall>("Call", CallSchema);
