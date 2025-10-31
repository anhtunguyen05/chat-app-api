import { Router, Request, Response } from "express";
import { upload } from "../app/middleware/upload.middleware";
import UserController from "../app/controller/user.controller";
import { verifyToken } from "../app/middleware/auth.middleware";

const router = Router();

router.get("/all", UserController.getAll);
router.get("/", UserController.getById);
router.get("/:slug", UserController.getBySlug);
router.put("/", UserController.update);
router.put("/avatar", upload.single("file"), UserController.updateAvatar);
router.put("/cover", upload.single("file"), UserController.updateCover);

export default router;
