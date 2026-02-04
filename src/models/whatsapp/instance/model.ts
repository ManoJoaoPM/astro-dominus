import { db, Schema } from "@/lib/mongoose";
import { WhatsAppInstanceInterface } from "./index";

export * from "./index";

const schema = new Schema<WhatsAppInstanceInterface>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    instanceName: { type: String, required: true, unique: true },
    status: { type: String, enum: ["connecting", "connected", "disconnected", "error"], default: "disconnected" },
    qrCode: { type: String },
    evolutionId: { type: String },
    phoneNumber: { type: String },
    profileName: { type: String },
    profilePicUrl: { type: String },
    lastActivityAt: { type: Date },
    lastWebhookAt: { type: Date },
    lastWebhookEvent: { type: String },
    lastWebhookError: { type: String },
    logs: [
      {
        event: { type: String },
        timestamp: { type: Date, default: Date.now },
        details: { type: Schema.Types.Mixed },
      },
    ],
  },
  { timestamps: true }
);

export const WhatsAppInstance =
  db?.models?.WhatsAppInstance ||
  db.model<WhatsAppInstanceInterface>("WhatsAppInstance", schema);
