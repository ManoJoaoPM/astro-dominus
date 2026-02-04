import { z } from "zod";
import { Types } from "mongoose";

export interface ReportBlockInterface {
  _id?: string;
  reportId: string | Types.ObjectId;
  templateId: string; // e.g., "SM-01"
  order: number;
  
  config: {
    metricsSelected: string[]; // List of metric keys to show
    title?: string; // Override default title
    filters?: Record<string, any>; // Specific filters (e.g. platform: 'instagram')
  };

  createdAt?: Date;
  updatedAt?: Date;
}

export const reportBlockSchema = z.object({
  reportId: z.string(),
  templateId: z.string(),
  order: z.number().default(0),
  config: z.object({
    metricsSelected: z.array(z.string()).default([]),
    title: z.string().optional(),
    filters: z.record(z.string(), z.any()).optional(),
  }).default({ metricsSelected: [] }),
});
