import { Schema, model, Document, Types } from "mongoose";

export interface IConversation {
  type: "private" | "group";
  name?: string; // tên nhóm
  avatar?: string; // ảnh nhóm
  participants: Types.ObjectId[];
  lastMessage?: Types.ObjectId | null;
}

export interface IConversationDocument extends IConversation, Document {}

const conversationSchema = new Schema<IConversationDocument>(
  {
    type: {
      type: String,
      enum: ["private", "group"],
      required: true,
    },
    name: {
      type: String,
      default: null,
    },
    avatar: {
      type: String,
      default: null,
    },
    participants: [
      { type: Schema.Types.ObjectId, ref: "User", required: true },
    ],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  { timestamps: true }
);

conversationSchema.set("toJSON", {
  transform: function (doc, ret: any) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Conversation = model<IConversationDocument>(
  "Conversation",
  conversationSchema
);
