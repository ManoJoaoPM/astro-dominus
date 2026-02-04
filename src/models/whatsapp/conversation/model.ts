import { db, Schema } from "@/lib/mongoose";
import { ConversationInterface } from "./index";

export * from "./index";

const schema = new Schema<ConversationInterface>(
  {
    instanceId: { type: Schema.Types.ObjectId, ref: "WhatsAppInstance", required: true, index: true },
    remoteJid: { type: String, required: true },
    contactName: { type: String },
    profilePicUrl: { type: String },
    
    lastMessageContent: { type: String },
    lastMessageAt: { type: Date, index: true },
    unreadCount: { type: Number, default: 0 },
    
    source: { type: String, enum: ["Orgânico", "Google Ads", "Meta Ads", "Não identificado"], default: "Não identificado" },
    isPinned: { type: Boolean, default: false },
    firstContactAt: { type: Date },
    lastMessagePreview: { type: String },
  },
  { timestamps: true }
);

// Unique conversation per instance + contact
schema.index({ instanceId: 1, remoteJid: 1 }, { unique: true });

export const Conversation =
  db?.models?.Conversation ||
  db.model<ConversationInterface>("Conversation", schema);
