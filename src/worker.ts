import redis from "./config/redis.config";
import messageService from "./app/services/message.service";

async function syncReadStatusToDB() {
  while (true) {
    const data = await redis.rpop("read_updates_queue");
    if (!data) break;

    const { userId, chatId, isGroup } = JSON.parse(data);
    if (isGroup) await messageService.markGroupMessagesAsRead(userId, chatId);
    else await messageService.markMessagesAsRead(userId, chatId);
  }
}

setInterval(syncReadStatusToDB, 5000);
console.log("🧵 Worker started to sync read status");
