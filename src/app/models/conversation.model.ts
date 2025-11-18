import { Schema, model, Document, Types } from "mongoose";

export interface IConversation {
  type: "private" | "group";
  participants: Types.ObjectId[];
  group?: Types.ObjectId | null; // nếu là group chat
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
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    group: { type: Schema.Types.ObjectId, ref: "Group", default: null },
    lastMessage: { type: Schema.Types.ObjectId, ref: "Message", default: null },
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
