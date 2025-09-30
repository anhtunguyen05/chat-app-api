import { Router, Request, Response } from "express";
import UserController from "../app/controller/user.controller";
import { verifyToken } from "../app/middleware/auth.middleware";

const router = Router();

router.get("/", verifyToken, UserController.getAll);
router.get("/:id", verifyToken, UserController.getById);

export default router;
