import { Schema, model, Document, Types } from "mongoose";

export interface IMessage {
  sender: Types.ObjectId;
  receiver?: Types.ObjectId | null; // người nhận 1-1
  group?: Types.ObjectId | null; // nhóm nhận
  text: string;
  imageUrls?: string[];
  type: "text" | "sticker" | "image" | "video" | "mixed";
  createdAt: Date;
}

export interface IMessageDocument extends IMessage, Document {}

const messageSchema = new Schema<IMessageDocument>(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: Schema.Types.ObjectId, ref: "User", default: null },
    group: { type: Schema.Types.ObjectId, ref: "Group", default: null },
    text: { type: String },
    imageUrls: [{ type: String }],
    type: {
      type: String,
      enum: ["text", "sticker", "image", "video", "mixed"],
      default: "text",
    },
  },
  { timestamps: true }
);

export const Message = model<IMessageDocument>("Message", messageSchema);
