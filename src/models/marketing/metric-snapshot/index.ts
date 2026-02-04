import { z } from "zod";
import { Types } from "mongoose";

export interface MetricSnapshotInterface {
  _id?: string;
  clientId: string | Types.ObjectId;
  provider: "meta_ads" | "google_ads" | "meta_insights";
  metricKey: string; // e.g. "spend", "clicks", "followers_count"
  
  date: Date; // Daily granularity usually
  value: number;
  
  dimensions?: {
    campaignId?: string;
    adGroupId?: string;
    adId?: string;
    platform?: string; // facebook vs instagram
  };

  createdAt?: Date;
  updatedAt?: Date;
}

export const metricSnapshotSchema = z.object({
  clientId: z.string(),
  provider: z.enum(["meta_ads", "google_ads", "meta_insights"]),
  metricKey: z.string(),
  date: z.string().or(z.date()),
  value: z.number(),
  dimensions: z.object({
    campaignId: z.string().optional(),
    adGroupId: z.string().optional(),
    adId: z.string().optional(),
    platform: z.string().optional(),
  }).optional(),
});
