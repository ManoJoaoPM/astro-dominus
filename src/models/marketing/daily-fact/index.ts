import { z } from "zod";
import { Types } from "mongoose";

export interface MarketingDailyFactInterface {
  _id?: string;
  integrationId: string | Types.ObjectId;
  date: Date;
  
  // Dimensions
  campaignId?: string;
  campaignName?: string;
  adsetId?: string;
  adsetName?: string;
  adId?: string;
  adName?: string;

  // Metrics
  spend: number;
  impressions: number;
  clicks: number;
  reach?: number;
  frequency?: number;
  
  createdAt?: Date;
  updatedAt?: Date;
}

export const marketingDailyFactSchema = z.object({
  integrationId: z.string(),
  date: z.string().or(z.date()),
  spend: z.number().default(0),
  impressions: z.number().default(0),
  clicks: z.number().default(0),
  
  campaignId: z.string().optional(),
  campaignName: z.string().optional(),
  adsetId: z.string().optional(),
  adsetName: z.string().optional(),
  adId: z.string().optional(),
  adName: z.string().optional(),
  
  reach: z.number().optional(),
  frequency: z.number().optional(),
});
