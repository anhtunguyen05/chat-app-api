import { Router, Request, Response } from "express";
import { upload } from "../app/middleware/upload.middleware";
import UserController from "../app/controller/user.controller";
import { verifyToken } from "../app/middleware/auth.middleware";

const router = Router();

// router.get("/", verifyToken, UserController.getAll);
router.get("/", verifyToken, UserController.getById);
router.put("/avatar", verifyToken, upload.single("file"), UserController.updateAvatar);
router.put("/", verifyToken, UserController.update);

export default router;
