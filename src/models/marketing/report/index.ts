import { z } from "zod";
import { Types } from "mongoose";

export interface ReportInterface {
  _id?: string;
  clientId: string | Types.ObjectId;
  name: string;
  slug: string; // Public link identifier
  isPublic: boolean;
  
  // Default date range for the report
  dateRange: {
    period: "custom" | "today" | "last_7d" | "last_30d" | "last_month" | "this_month";
    startDate?: Date;
    endDate?: Date;
  };

  createdAt?: Date;
  updatedAt?: Date;
}

export const reportSchema = z.object({
  clientId: z.string(),
  name: z.string().min(1, "Nome é obrigatório"),
  slug: z.string().optional(), // Generated on server if missing
  isPublic: z.preprocess((val) => {
    if (Array.isArray(val)) return val.includes("on") || val.includes("true");
    if (val === "on" || val === "true") return true;
    return Boolean(val);
  }, z.boolean().default(false)),
  dateRange: z.object({
    period: z.enum(["custom", "today", "last_7d", "last_30d", "last_month", "this_month"]),
    startDate: z.string().or(z.date()).optional(),
    endDate: z.string().or(z.date()).optional(),
  }).default({ period: "last_30d" }),
});
