import cloudinary from "../../../cloudinary.config";
import { User, IUser } from "../models/user.model";
import cloudUtil from "../../utils/cloud.util";

class UserService {
  // Lấy tất cả users
  async getAll(): Promise<IUser[]> {
    return await User.find().select("-password"); // Ẩn password
  }

  // Tìm user theo ID
  async getById(id: string): Promise<IUser | null> {
    return await User.findById(id).select("-password");
  }

  // Tạo user mới
  async create(
    data: Pick<IUser, "nickname" | "email" | "password">
  ): Promise<IUser> {
    // Ở đây bạn chỉ cho phép data chứa 3 field: nickname, email, password.
    const user = new User(data);
    return await user.save();
  }

  async updateAvatar(
    id: string,
    file: Express.Multer.File
  ): Promise<IUser> {
    // 1. Lấy user từ DB
    const user = await User.findById(id);
    if (!user) throw new Error("User not found");

    // 2. Nếu có avatar cũ -> xóa
    if (user.avatarUrl) {
      try {
        // avatarUrl kiểu: https://res.cloudinary.com/<cloud_name>/image/upload/v123456789/avatars/abcxyz.png
        const parts = user.avatarUrl.split("/");
        const publicIdWithExt = parts[parts.length - 1] as string; // abcxyz.png
        const folder = parts[parts.length - 2]; // avatars
        const publicId = `${folder}/${publicIdWithExt.split(".")[0]}`; // avatars/abcxyz

        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error("❌ Failed to delete old avatar:", err);
      }
    }

    // 3. Upload ảnh mới
    const result = await cloudUtil.uploadToCloudinary(file, "avatars");

    // 4. Update user trong DB
    user.avatarUrl = result.secure_url;
    await user.save();

    return user;
  }

  // Cập nhật user
  async update(id: string, data: Partial<IUser>): Promise<IUser | null> {
    return await User.findByIdAndUpdate(id, data, { new: true }).select(
      "-password"
    );
  }

  // Xóa user
  async remove(id: string): Promise<IUser | null> {
    return await User.findByIdAndDelete(id);
  }
}

export default new UserService();
