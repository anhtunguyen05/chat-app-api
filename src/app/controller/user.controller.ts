import { Request, Response } from "express";
import cloudinary from "../../../cloudinary.config";
import userService from "../services/user.service";

class UserController {
  async getAll(req: Request, res: Response) {
    try {
      const users = await userService.getAll();
      res.json(users);
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const user = await userService.getById(req.id as string);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const updatedUser = await userService.update(req.id as string, req.body);
      if (!updatedUser)
        return res.status(404).json({ message: "User not found" });
      res.json({
        message: "Avatar updated successfully",
        user: updatedUser,
      });
    } catch (err) {
      res.status(400).json({ message: "Update failed", error: err });
    }
  }

  async updateAvatar(req: Request, res: Response) {
    try {
      const id = req.id as string;
      const file = req.file;

      if (!file) return res.status(400).json({ message: "No file uploaded" });

      const updatedUser = await userService.updateAvatar(id, file);

      res.json({
        message: "Avatar updated successfully",
        user: updatedUser,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }

  async updateCover(req: Request, res: Response) {
    try {
      const id = req.id as string;
      const file = req.file;

      if (!file) return res.status(400).json({ message: "No file uploaded" });

      const updatedUser = await userService.updateCover(id, file);

      res.json({
        message: "Update Cover updated successfully",
        user: updatedUser,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const deletedUser = await userService.remove(req.id as string);
      if (!deletedUser)
        return res.status(404).json({ message: "User not found" });
      res.json({ message: "User deleted", user: deletedUser });
    } catch (err) {
      res.status(500).json({ message: "Delete failed", error: err });
    }
  }
}

export default new UserController();
