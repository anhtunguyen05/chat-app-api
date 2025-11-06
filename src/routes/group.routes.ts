import { Router } from "express";
import GroupController from "../app/controller/group.controller";

const router = Router();

router.post("/", GroupController.createGroup);
router.get("/:groupId/members", GroupController.getGroupMembers)
router.post("/:groupId/members", GroupController.addMembers);
router.delete("/:groupId/members/:memberId", GroupController.removeMember);
router.get("/", GroupController.getUserGroups);

export default router;
