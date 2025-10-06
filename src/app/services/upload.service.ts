import { v2 as cloudinary } from "cloudinary";
import { IUser } from "../models/user.model"; 
import { User } from "../models/user.model";
import cloudUtil from "../../utils/cloud.util";

class UploadService {
  /**
   * Hàm upload ảnh lên Cloudinary và cập nhật user field tương ứng (avatarUrl hoặc coverUrl)
   * @param id userId
   * @param file multer file
   * @param field "avatarUrl" hoặc "coverUrl"
   * @param folder folder lưu trên Cloudinary, ví dụ "avatars" hoặc "covers"
   */
  async updateUserImage(
    id: string,
    file: Express.Multer.File,
    field: "avatarUrl" | "coverUrl",
    folder: string
  ): Promise<IUser> {
    // 1️⃣ Lấy user từ DB
    const user = await User.findById(id);
    if (!user) throw new Error("User not found");

    // 2️⃣ Xóa ảnh cũ (nếu có)
    const oldUrl = user[field];
    if (oldUrl) {
      try {
        const parts = oldUrl.split("/");
        const publicIdWithExt = parts[parts.length - 1] as string;
        const folderName = parts[parts.length - 2];
        const publicId = `${folderName}/${publicIdWithExt.split(".")[0]}`;
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error(`❌ Failed to delete old ${field}:`, err);
      }
    }

    // 3️⃣ Upload ảnh mới
    const result = await cloudUtil.uploadToCloudinary(file, folder);

    // 4️⃣ Update field tương ứng
    user[field] = result.secure_url;
    await user.save();

    return user;
  }
}

export default new UploadService();
