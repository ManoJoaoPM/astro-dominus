import { db, Schema } from "@/lib/mongoose";
import { MetricSnapshotInterface } from "./index";

export * from "./index";

const schema = new Schema<MetricSnapshotInterface>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    provider: { type: String, required: true },
    metricKey: { type: String, required: true },
    date: { type: Date, required: true },
    value: { type: Number, required: true },
    
    dimensions: {
      campaignId: String,
      adGroupId: String,
      adId: String,
      platform: String,
    },
  },
  { timestamps: true }
);

// Compound index for efficient lookup and upsert
schema.index({ clientId: 1, provider: 1, metricKey: 1, date: 1 }, { unique: true });

export const MetricSnapshot =
  db?.models?.MetricSnapshot ||
  db.model<MetricSnapshotInterface>("MetricSnapshot", schema);
