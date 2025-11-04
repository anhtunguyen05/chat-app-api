import { Schema, model, Document, Types } from "mongoose";

export interface IGroup {
  name: string;
  members: Types.ObjectId[];
  createdBy: Types.ObjectId;
}

export interface IGroupDocument extends IGroup, Document {}

const groupSchema = new Schema<IGroupDocument>(
  {
    name: { type: String, required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

groupSchema.set("toJSON", {
  transform: function (doc, ret: any) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Group = model<IGroupDocument>("Group", groupSchema);
