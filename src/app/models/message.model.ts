import { Schema, model, Document, Types } from "mongoose";

export interface IMessage {
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  text: string;
  imageUrls?: string[];
  type: "text" | "sticker" | "image" | "video" | "mixed";
  createdAt: Date;
}

export interface IMessageDocument extends IMessage, Document {}

const messageSchema = new Schema<IMessageDocument>(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, },
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
