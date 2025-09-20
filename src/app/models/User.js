const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email là bắt buộc"],
      unique: true,
      match: [/.+@.+\..+/, "Email không hợp lệ"],
    },
    password: {
      type: String,
      required: [true, "Password là bắt buộc"],
      minlength: [6, "Password phải >= 6 ký tự"],
    },
    nickname: { type: String },
    avatarUrl: { type: String },
    online: { type: Boolean, default: false },
    lastSeen: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
