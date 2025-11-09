import mongoose from "mongoose";
import { Message } from "../models/message.model";
import { Group } from "../models/group.model";
import uploadService from "./upload.service";

class MessageService {
  async saveMessageToDB(
    senderId: string,
    receiverId: string | null,
    text: string,
    imageUrls: string[],
    type: string,
    groupId?: string | null
  ) {
    // ✅ Xác định loại tin nhắn
    if (!receiverId && !groupId) {
      throw new Error("Must provide either receiverId or groupId");
    }

    const messageData: any = {
      sender: senderId,
      text,
      imageUrls,
      type,
      receiver: receiverId || null,
      group: groupId || null,
    };

    const message = await Message.create(messageData);

    if (receiverId) {
      return message.populate("sender receiver", "nickname avatarUrl");
    } else {
      return message.populate("sender", "nickname avatarUrl");
    }
  }

  async getAllConversations(userId: string) {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    /** 🔹 Helper đổi _id -> id */
    const toId = (obj: any) => {
      if (!obj) return null;
      const { _id, __v, ...rest } = obj;
      return { id: _id, ...rest };
    };

    // 🔸 1. Cuộc hội thoại cá nhân
    const privateConvos = await Message.aggregate([
      {
        $match: {
          group: null,
          $or: [{ sender: userObjectId }, { receiver: userObjectId }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$sender", userObjectId] }, "$receiver", "$sender"],
          },
          lastMessage: { $first: "$$ROOT" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "target",
        },
      },
      { $unwind: "$target" },
      {
        $project: {
          type: { $literal: "private" },
          target: {
            _id: "$target._id",
            nickname: "$target.nickname",
            avatarUrl: "$target.avatarUrl",
            lastSeen: "$target.lastSeen"
          },
          lastMessage: 1,
        },
      },
    ]);

    const formattedPrivate = privateConvos.map((c) => ({
      id: c._id,
      type: c.type,
      target: toId(c.target),
      lastMessage: c.lastMessage ? toId(c.lastMessage) : null,
    }));

    // 🔸 2. Cuộc hội thoại nhóm
    const groups = await Group.find({ members: userObjectId })
      .select("_id name avatarUrl")
      .lean();

    const groupIds = groups.map((g) => g._id);
    const groupLastMessages = await Message.aggregate([
      { $match: { group: { $in: groupIds } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$group", lastMessage: { $first: "$$ROOT" } } },
    ]);

    const groupConvos = groups.map((group) => {
      const last = groupLastMessages.find((m) => m._id.equals(group._id));
      return {
        id: group._id,
        type: "group",
        target: toId(group),
        lastMessage: last ? toId(last.lastMessage) : null,
      };
    });

    // 🔸 3. Gộp và sắp xếp
    return [...formattedPrivate, ...groupConvos].sort((a, b) => {
      const timeA = a.lastMessage?.createdAt
        ? new Date(a.lastMessage.createdAt).getTime()
        : 0;
      const timeB = b.lastMessage?.createdAt
        ? new Date(b.lastMessage.createdAt).getTime()
        : 0;
      return timeB - timeA;
    });
  }

  async getConversation(
    user1: string,
    user2: string,
    page = "1",
    limit = "20"
  ) {
    const skip = (Number(page) - 1) * Number(limit);

    return Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 },
      ],
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("sender receiver", "nickname avatarUrl");
  }

  async getGroupConversation(groupId: string, page = "1", limit = "20") {
    const skip = (Number(page) - 1) * Number(limit);

    return Message.find({ group: groupId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("sender", "nickname avatarUrl");
  }
}

export default new MessageService();
