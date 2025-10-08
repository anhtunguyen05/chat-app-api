import mongoose, { Document, Schema, model } from "mongoose";
import slugify from "slugify";

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
  slug?: string;
}

// Document trong DB
export interface IUserDocument extends IUser, Document {}

const userSchema = new Schema<IUserDocument>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, minlength: 6 },
    nickname: String,
    avatarUrl: String,
    coverUrl: String,
    slug: { type: String, unique: true },
    online: { type: Boolean, default: false },
    lastSeen: Date,
  },
  { timestamps: true }
);

// Generic kiểu cho pre để TS biết this là IUserDocument
userSchema.pre<IUserDocument>("save", async function (next) {
  // nếu không thay đổi nickname và đã có slug thì bỏ qua
  if (!this.isModified("nickname") && this.slug) return next();

  // đảm bảo có một chuỗi dùng để tạo slug
  const fallback = `user-${Date.now()}`; // fallback an toàn nếu email và nickname đều thiếu
  const baseSource =
    this.nickname ??
    (typeof this.email === "string" ? this.email.split("@")[0] : undefined) ??
    fallback;

  // ép chắc chắn thành string
  const base = String(baseSource);

  const baseSlug = slugify(base, { lower: true, strict: true });

  let uniqueSlug = baseSlug;
  let counter = 1;

  // this.constructor có kiểu bất định, cast về Model<IUserDocument>
  const UserModel = this.constructor as mongoose.Model<IUserDocument>;

  // đảm bảo unique
  while (await UserModel.findOne({ slug: uniqueSlug })) {
    uniqueSlug = `${baseSlug}-${counter++}`;
  }

  this.slug = uniqueSlug;
  next();
});

export const User = model<IUserDocument>("User", userSchema);
