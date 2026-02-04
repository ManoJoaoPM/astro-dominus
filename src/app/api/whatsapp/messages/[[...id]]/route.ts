import { Message } from "@/models/whatsapp/message/model";
import { CRUDController } from "@/struct";
import { ObjectId } from "@/lib/mongoose";

export const {
  GET,
  dynamic,
  runtime,
} = new CRUDController(Message, {
  roles: {
    GET: ["admin", "operational", "commercial"],
  },
  sort: { timestamp: -1 }, // Default: Newest first (optimized for latest 20)
  hooks: {
    beforeGet: async ({ query }) => {
      if (query.conversationId) {
        query.conversationId = new ObjectId(query.conversationId as string);
      }
      
      // Pagination: limit
      if (query.limit) {
        // CRUDController handles 'limit' automatically if passed as number
        // but often passed as string in query
        query.limit = parseInt(query.limit as string) || 20;
      } else {
        query.limit = 20; // Default limit
      }

      // Pagination: before (timestamp for scrolling up)
      if (query.before) {
        query.timestamp = { $lt: Number(query.before) };
        delete query.before;
      }
    }
  }
});
