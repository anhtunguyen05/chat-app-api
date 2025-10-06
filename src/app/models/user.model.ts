import { Document, Schema, model } from "mongoose";

// Data thuần
export interface IUser {
  email: string;
  password?: string;
  nickname?: string;
  avatarUrl?: string;
  coverUrl?: string;
  online: boolean;
  lastSeen?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Document trong DB
export interface IUserDocument extends IUser, Document {}

const userSchema = new Schema<IUserDocument>({
  email: { type: String, required: true, unique: true },
  password: { type: String, minlength: 6 },
  nickname: String,
  avatarUrl: String,
  coverUrl: String,
  online: { type: Boolean, default: false },
  lastSeen: Date,
}, { timestamps: true });

export const User = model<IUserDocument>("User", userSchema);
