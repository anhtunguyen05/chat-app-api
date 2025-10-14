import http from "http";
import { Server } from "socket.io";
import { initSocket } from "../socket";

export function setupSocket(app: any) {
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  initSocket(io);

  // Cho phép import io ở nơi khác nếu cần
  return { server, io };
}
