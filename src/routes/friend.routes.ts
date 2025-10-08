import { Router, Request, Response } from "express";
import FriendController from "../app/controller/friend.controller";
import { verifyToken } from "../app/middleware/auth.middleware";

const router = Router();

router.post("/request", verifyToken, FriendController.sendRequest);
router.post("/accept/:requestId", verifyToken, FriendController.acceptRequest);
router.get("/", verifyToken, FriendController.getFriends);
router.get("/request", verifyToken, FriendController.getFriendRequests);



export default router;