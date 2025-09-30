import { Router } from "express";
import {
  registerValidator,
  loginValidator,
} from "../validators/auth.validator";
import validateRequest from "../app/middleware/validateRequest.middleware";
import AuthController from "../app/controller/auth.controller";

const router = Router();

// Routes gọi thẳng method của class
router.post(
  "/register",
  registerValidator,
  validateRequest,
  AuthController.register
);
router.post("/login", loginValidator, validateRequest, AuthController.login);
router.post("/google", AuthController.googleLogin);
router.post("/logout", AuthController.logout);
router.post("/refresh-token", AuthController.refreshToken);

export default router;
