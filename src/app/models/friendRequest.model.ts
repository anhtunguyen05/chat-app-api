import { Document, Schema, model, Types } from "mongoose";
import { FriendRequestStatus } from "../../enums/message.enum";

export interface IFriendRequest {
  from: Types.ObjectId;
  to: Types.ObjectId;
  status: FriendRequestStatus;
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
      enum: Object.values(FriendRequestStatus),
      default: FriendRequestStatus.PENDING,
    },
  },
  { timestamps: true }
);

friendRequestSchema.set("toJSON", {
  transform: function (doc, ret: any) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const FriendRequest = model<IFriendRequestDocument>(
  "FriendRequest",
  friendRequestSchema
);
