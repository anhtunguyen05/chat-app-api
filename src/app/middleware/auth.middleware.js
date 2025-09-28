const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  const token = req.cookies.accessToken; // token trong cookie httpOnly

  if (!token) {
    return res.status(401).json({ message: "Không có token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // gắn user id vào req để controller dùng
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }
}

module.exports = { verifyToken };
