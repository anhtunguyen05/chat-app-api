import { Group } from "../models/group.model";
import { Types } from "mongoose";

class GroupService {
  /** 🔹 Tạo nhóm mới */
  async createGroup(name: string, members: string[], createdBy: string) {
    // thêm người tạo vào danh sách members nếu chưa có
    if (!members.includes(createdBy)) {
      members.push(createdBy);
    }

    const group = await Group.create({
      name,
      members: members.map((id) => new Types.ObjectId(id)),
      createdBy: new Types.ObjectId(createdBy),
    });

    return group.populate("members", "name avatar email");
  }

  /** 🔹 Thêm thành viên vào nhóm */
  async addMembers(groupId: string, newMembers: string[]) {
    const group = await Group.findById(groupId);
    if (!group) throw new Error("Group not found");

    const existingMemberIds = group.members.map((id) => id.toString());
    const membersToAdd = newMembers.filter(
      (id) => !existingMemberIds.includes(id)
    );

    group.members.push(...membersToAdd.map((id) => new Types.ObjectId(id)));
    await group.save();

    return group.populate("members", "name avatar email");
  }

  /** 🔹 Xoá thành viên khỏi nhóm */
  async removeMember(groupId: string, memberId: string) {
    const group = await Group.findById(groupId);
    if (!group) throw new Error("Group not found");

    group.members = group.members.filter(
      (id) => id.toString() !== memberId.toString()
    );
    await group.save();

    return group.populate("members", "name avatar email");
  }

  /** 🔹 Lấy tất cả nhóm của 1 user */
  async getUserGroups(userId: string) {
    return Group.find({ members: userId })
      .populate("members", "name avatar email")
      .sort({ updatedAt: -1 });
  }
}

export default new GroupService();
