import { db, Schema } from "@/lib/mongoose";
import { MarketingIntegrationInterface } from "./index";

export * from "./index";

const schema = new Schema<MarketingIntegrationInterface>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    provider: { type: String, enum: ["meta", "google"], required: true },
    name: { type: String, required: true },
    
    // Auth & Config
    adAccountId: { type: String, required: true },
    accessToken: { type: String },
    refreshToken: { type: String },
    tokenExpiresAt: { type: Date },
    
    status: { type: String, enum: ["active", "error", "disconnected"], default: "active" },
    errorMessage: { type: String },
    
    lastSyncAt: { type: Date },
  },
  { timestamps: true }
);

// Compound index for uniqueness
schema.index({ clientId: 1, provider: 1, adAccountId: 1 }, { unique: true });

export const MarketingIntegration =
  db?.models?.MarketingIntegration ||
  db.model<MarketingIntegrationInterface>("MarketingIntegration", schema);
