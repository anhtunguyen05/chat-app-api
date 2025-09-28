const { body } = require("express-validator");

// Đăng ký
const registerValidator = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email không được để trống")
    .isEmail().withMessage("Email không hợp lệ"),

  body("password")
    .notEmpty().withMessage("Password không được để trống")
    .isLength({ min: 6 }).withMessage("Password phải >= 6 ký tự"),
];

// Đăng nhập
const loginValidator = [
  body("email")
    .notEmpty().withMessage("Vui lòng nhập Email"),
  body("password")
    .notEmpty().withMessage("Vui lòng nhập Password"),
];

module.exports = {
  registerValidator,
  loginValidator,
};