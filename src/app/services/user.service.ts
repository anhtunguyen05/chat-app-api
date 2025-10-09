import { User, IUser } from "../models/user.model";
import friendService from "./friend.service";
import uploadService from "./upload.service";

class UserService {
  // Lấy tất cả users
  async getAll(): Promise<IUser[]> {
    return await User.find().select("-password"); // Ẩn password
  }

  // Tìm user theo ID
  async getById(id: string): Promise<IUser | null> {
    return await User.findById(id).select("-password");
  }

  async getBySlug(
    slug: string,
    currentUserId?: string
  ): Promise<{
    user: IUser | null;
    relationship?: string;
  }> {
    // 1️⃣ Tìm user theo slug
    const user = await User.findOne({ slug }).select("-password");
    if (!user) return { user: null };

    // 2️⃣ Nếu có currentUserId (đã đăng nhập), lấy relationship
    let relationship;
    if (currentUserId) {
      relationship = await friendService.getRelationshipStatus(
        currentUserId,
        user.id.toString()
      );
    }

    // 3️⃣ Trả về cả user và relationship
    return { user, relationship };
  }

  // Tạo user mới
  async create(
    data: Pick<IUser, "nickname" | "email" | "password">
  ): Promise<IUser> {
    // Ở đây bạn chỉ cho phép data chứa 3 field: nickname, email, password.
    const user = new User(data);
    return await user.save();
  }

  async updateAvatar(id: string, file: Express.Multer.File): Promise<IUser> {
    return uploadService.updateUserImage(id, file, "avatarUrl", "avatars");
  }

  async updateCover(id: string, file: Express.Multer.File): Promise<IUser> {
    return uploadService.updateUserImage(id, file, "coverUrl", "covers");
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
