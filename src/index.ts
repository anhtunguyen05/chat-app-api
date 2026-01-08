import dotenv from "dotenv";
dotenv.config();

import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connect } from "./config/db.config";
import "./config/redis.config";
import route from "./routes";
import { setupSocket } from "./config/socket.config";

const app: Application = express();

// ✅ Kết nối DB
connect();

// ✅ CORS
const allowedOrigins = [
  "http://localhost:3000",
  "https://your-fe.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); 
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
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

const { server } = setupSocket(app);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
