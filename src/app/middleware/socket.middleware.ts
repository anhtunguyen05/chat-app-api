import { Socket } from "socket.io";
import jwt, { JwtPayload } from "jsonwebtoken";
import * as cookie from "cookie";

function parseCookies(header?: string) {
  if (!header) return {};
  return cookie.parse(header);
}

export function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void) {
  try {
    // Lấy cookie từ handshake
    const cookies = parseCookies(socket.handshake.headers.cookie);
    const accessToken = cookies.accessToken;

    if (!accessToken) {
      return next(new Error("UNAUTHENTICATED"));
    }

    // Verify access token
    const decoded = jwt.verify(
      accessToken,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    // Gắn userId vào socket
    socket.data.userId = decoded.id;
    next();
  } catch (e) {
    // Token hết hạn hoặc invalid → Client cần gọi API refresh rồi reconnect
    next(new Error("UNAUTHENTICATED"));
  }
}
