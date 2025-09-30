import { body } from "express-validator";
import { ValidationChain } from "express-validator";

export const registerValidator: ValidationChain[] = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email không được để trống")
    .isEmail().withMessage("Email không hợp lệ"),

  body("password")
    .notEmpty().withMessage("Password không được để trống")
    .isLength({ min: 6 }).withMessage("Password phải >= 6 ký tự"),
];

export const loginValidator: ValidationChain[] = [
  body("email")
    .notEmpty().withMessage("Vui lòng nhập Email"),

  body("password")
    .notEmpty().withMessage("Vui lòng nhập Password"),
];
