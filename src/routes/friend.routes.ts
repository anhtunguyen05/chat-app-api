import { Router, Request, Response } from "express";
import FriendController from "../app/controller/friend.controller";
import { verifyToken } from "../app/middleware/auth.middleware";

const router = Router();

router.post("/request/:toId", FriendController.sendRequest);
router.put("/accept/:fromId", FriendController.acceptRequest);
router.put("/reject/:fromId", FriendController.rejectRequest);
router.delete("/cancel/:toId", FriendController.cancelRequest);
router.delete("/unfriend/:userId", FriendController.unfriend);
router.get("/", FriendController.getFriends);
router.get("/none-friend", FriendController.getNoneFriends);
router.get("/request", FriendController.getFriendRequests);

export default router;
