import { Schema, model, Document, Types } from "mongoose";

export interface IConversationParticipant {
  conversation: Types.ObjectId;
  user: Types.ObjectId;
  role: "member" | "admin";
  lastSeenMessage?: Types.ObjectId | null;
}

export interface IConversationParticipantDocument
  extends IConversationParticipant,
    Document {}

const conversationParticipantSchema =
  new Schema<IConversationParticipantDocument>(
    {
      conversation: {
        type: Schema.Types.ObjectId,
        ref: "Conversation",
        required: true,
      },
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      role: { type: String, enum: ["member", "admin"], default: "member" },
      lastSeenMessage: {
        type: Schema.Types.ObjectId,
        ref: "Message",
        default: null,
      },
    },
    { timestamps: true }
  );

conversationParticipantSchema.set("toJSON", {
  transform: function (doc, ret: any) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const ConversationParticipant = model<IConversationParticipantDocument>(
  "ConversationParticipant",
  conversationParticipantSchema
);
