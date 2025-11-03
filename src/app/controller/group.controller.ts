import { Request, Response } from "express";
import groupService from "../services/group.service";

class GroupController {
  /** 🔹 Tạo nhóm mới */
  async createGroup(req: Request, res: Response) {
    try {
      const { name, members } = req.body;
      const createdBy = req.id;
      if (!createdBy) {
        res.status(400).json("Lỗi không tìm ra Id người tạo");
        return;
      }
      const group = await groupService.createGroup(name, members, createdBy);
      res.status(201).json(group);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /** 🔹 Thêm thành viên */
  async addMembers(req: Request, res: Response) {
    try {
      const { groupId } = req.params;
      const { members } = req.body;
      if (!groupId) {
        res.status(400).json("Lỗi không tìm ra groupId");
        return;
      }
      const group = await groupService.addMembers(groupId, members);
      res.status(200).json(group);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /** 🔹 Xoá thành viên */
  async removeMember(req: Request, res: Response) {
    try {
      const { groupId, memberId } = req.params;
      if (!groupId || !memberId) {
        res.status(400).json("Lỗi không tìm ra groupId hoặc memberId");
        return;
      }
      const group = await groupService.removeMember(groupId, memberId);
      res.status(200).json(group);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /** 🔹 Lấy danh sách nhóm của 1 user */
  async getUserGroups(req: Request, res: Response) {
    try {
      const userId = req.id;
      if (!userId) {
        res.status(400).json("Lỗi không tìm ra userId");
        return;
      }
      const groups = await groupService.getUserGroups(userId);
      res.status(200).json(groups);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}

export default new GroupController();
