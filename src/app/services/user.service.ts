import {User, IUser} from "../models/user.model";

class UserService {
    // Lấy tất cả users
  async getAll(): Promise<IUser[]> {
    return await User.find().select("-password"); // Ẩn password
  };

  // Tìm user theo ID
  async getById(id: string): Promise<IUser | null> {
    return await User.findById(id).select("-password");
  };

  // Tạo user mới
  async create(data: Pick<IUser, "nickname" | "email" | "password">): Promise<IUser> { // Ở đây bạn chỉ cho phép data chứa 3 field: nickname, email, password.
    const user = new User(data);
    return await user.save();
  };

  // Cập nhật user
  async update(id: string, data: Partial<IUser>): Promise<IUser | null> {
    return await User.findByIdAndUpdate(id, data, { new: true }).select("-password");
  };

  // Xóa user
   async remove(id: string): Promise<IUser | null> {
    return await User.findByIdAndDelete(id);
  };
}

export default new UserService();