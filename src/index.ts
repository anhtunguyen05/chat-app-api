import dotenv from "dotenv";
dotenv.config();

import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { connect } from "./config/database";
import route from "./routes";

const app: Application = express();

// ✅ Kết nối DB
connect();

// ✅ CORS
app.use(
  cors({
    origin: "http://localhost:3000", // hoặc "*" cho dev
    credentials: true,               // bật nếu dùng cookie
  })
);

// ✅ Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// ✅ Route test
app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

// ✅ Route chính
route(app);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
