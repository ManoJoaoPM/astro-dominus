import { z } from "zod";
import { Types } from "mongoose";

export interface MessageInterface {
  _id?: string;
  conversationId: string | Types.ObjectId;
  instanceId: string | Types.ObjectId;
  
  evolutionId: string; // Message ID from Evolution
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  
  direction: "inbound" | "outbound";
  messageType: "text" | "image" | "audio" | "video" | "document" | "other";
  content: string; // Text body or caption
  mediaUrl?: string;
  mediaMeta?: {
    mimetype?: string;
    filename?: string;
    filesize?: number;
    url?: string;
  };
  
  timestamp: number; // Unix timestamp
  
  // Intelligence Analysis
  analysis?: {
    intent?: string; // e.g., "purchase_intent", "support"
    sentiment?: "positive" | "neutral" | "negative";
    keywords?: string[];
    summary?: string;
  };

  createdAt?: Date;
  updatedAt?: Date;
}

export const messageSchema = z.object({
  conversationId: z.string(),
  instanceId: z.string(),
  evolutionId: z.string(),
  key: z.object({
    remoteJid: z.string(),
    fromMe: z.boolean(),
    id: z.string(),
  }),
  direction: z.enum(["inbound", "outbound"]),
  messageType: z.enum(["text", "image", "audio", "video", "document", "other"]),
  content: z.string(),
  timestamp: z.number(),
});
