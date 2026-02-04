import { db, Schema } from "@/lib/mongoose";
import { MessageInterface } from "./index";

export * from "./index";

const schema = new Schema<MessageInterface>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    instanceId: { type: Schema.Types.ObjectId, ref: "WhatsAppInstance", required: true },
    
    evolutionId: { type: String, required: true, unique: true },
    key: {
      remoteJid: { type: String, required: true },
      fromMe: { type: Boolean, required: true },
      id: { type: String, required: true },
    },
    
    direction: { type: String, enum: ["inbound", "outbound"], required: true, index: true },
    messageType: { type: String, default: "text" },
    content: { type: String },
    mediaUrl: { type: String },
    mediaMeta: {
      mimetype: String,
      filename: String,
      filesize: Number,
      url: String,
    },
    
    timestamp: { type: Number, required: true, index: true },
    
    analysis: {
      intent: String,
      sentiment: String,
      keywords: [String],
      summary: String,
    },
  },
  { timestamps: true }
);

// TTL Index for 180 days (180 * 24 * 60 * 60 = 15552000 seconds)
schema.index({ createdAt: 1 }, { expireAfterSeconds: 15552000 });

export const Message =
  db?.models?.Message ||
  db.model<MessageInterface>("Message", schema);
