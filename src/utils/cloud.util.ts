import cloudinary from "../../cloudinary.config";
import streamifier from "streamifier";

class CloudUtil {
  uploadToCloudinary = (
    file: Express.Multer.File,
    folder: string
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      // đẩy buffer của multer vào cloudinary
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  };
}

export default new CloudUtil();