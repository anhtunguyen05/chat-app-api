import { Request, Response } from "express";
import {User} from "../models/user.model";
import authService from "../services/auth.service";

class AuthController {
  async refreshToken(req: Request, res: Response): Promise<Response> {
    try {
      const oldRefreshToken = req.cookies.refreshToken as string | undefined;
      const { accessToken, refreshToken } = await authService.refreshToken(
        oldRefreshToken as string 
      );

      authService.saveRefreshToken(res, refreshToken);

      return res.json({ accessToken });
    } catch (err: any) {
      return res.status(401).json({ message: err.message });
    }
  }

  async register(req: Request, res: Response): Promise<Response> {
    try {
      const result = await authService.register(req.body);
      return res.status(201).json(result);
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  }

  async login(req: Request, res: Response): Promise<Response> {
    try {
      const { user, accessToken, refreshToken } = await authService.login(
        req.body,
        res
      );

      authService.saveToken(res, accessToken);
      authService.saveRefreshToken(res, refreshToken);

      return res.json({
        user,
        message: "Login success",
        accessToken: accessToken,
        refreshToken: refreshToken,
      });
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  }

  async googleLogin(req: Request, res: Response): Promise<Response> {
    try {
      console.log("req.body:", req.body);
      const { token } = req.body as { token: string };
      const { user, accessToken, refreshToken } = await authService.googleLogin(
        token
      );

      authService.saveToken(res, accessToken);
      authService.saveRefreshToken(res, refreshToken);

      return res.json({
        user,
        message: "Login success",
      });
    } catch (err: any) {
      console.error(err);
      return res.status(400).json({ message: err.message });
    }
  }

  async logout(req: Request, res: Response): Promise<Response> {
    try {
      const result = await authService.logout(res);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  }
}

export default new AuthController();
