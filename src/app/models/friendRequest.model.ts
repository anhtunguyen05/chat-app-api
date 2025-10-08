import { Document, Schema, model, Types } from "mongoose";

export interface IFriendRequest {
  from: Types.ObjectId;
  to: Types.ObjectId;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

export interface IFriendRequestDocument extends IFriendRequest, Document {}

const friendRequestSchema = new Schema<IFriendRequestDocument>(
  {
    from: { type: Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export const FriendRequest = model<IFriendRequestDocument>(
  "FriendRequest",
  friendRequestSchema
);
