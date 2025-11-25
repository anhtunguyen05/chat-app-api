import { Router, Request, Response } from "express";
import ConversationController from "../app/controller/conversation.controller";

const router = Router();

router.get("/", ConversationController.getMySidebar);
router.get("/:conversationId/participants", ConversationController.getConversationParticipants);
router.post("/group", ConversationController.createGroup);
router.post("/group/:conversationId/members", ConversationController.addMembers);
router.delete("/group/:conversationId/members/:userId", ConversationController.removeMember);
router.get("/group/:conversationId/members", ConversationController.getGroupMembers);

export default router;
