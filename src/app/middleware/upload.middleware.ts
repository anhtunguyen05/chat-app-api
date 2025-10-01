import multer from "multer";

// Lưu file tạm trong RAM hoặc ổ đĩa
const storage = multer.memoryStorage();
export const upload = multer({ storage });
