import { db, Schema } from "@/lib/mongoose";
import { MarketingDailyFactInterface } from "./index";

export * from "./index";

const schema = new Schema<MarketingDailyFactInterface>(
  {
    integrationId: { type: Schema.Types.ObjectId, ref: "MarketingIntegration", required: true, index: true },
    date: { type: Date, required: true, index: true },

    // Dimensions (Optional - Account level sync won't use these)
    campaignId: { type: String, required: false },
    campaignName: { type: String, required: false },
    adsetId: { type: String, required: false },
    adsetName: { type: String, required: false },
    adId: { type: String, required: false },
    adName: { type: String, required: false },

    // Metrics
    spend: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    reach: { type: Number, default: 0 },
    frequency: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound index: integration + date (unique for account level)
// We remove adId from index to enforce one record per day per integration
schema.index({ integrationId: 1, date: 1 }, { unique: true });

export const MarketingDailyFact =
  db?.models?.MarketingDailyFact ||
  db.model<MarketingDailyFactInterface>("MarketingDailyFact", schema);
