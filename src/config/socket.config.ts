import http from "http";
import { Server } from "socket.io";
import { initSocket } from "../socket";
import { socketAuthMiddleware } from "../app/middleware/socket.middleware";

export function setupSocket(app: any) {
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: "*", credentials: true, methods: ["GET", "POST"] },
  });

  // Áp dụng auth middleware cho socket
  io.use(socketAuthMiddleware);

  initSocket(io);

  return { server, io };
}
