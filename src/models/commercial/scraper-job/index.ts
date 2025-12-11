import { z } from "zod";

export type ScraperJobStatus = "pending" | "running" | "completed" | "failed";

export interface ScraperJobInterface {
  _id?: string;

  query: string; // ex: "imobiliária em São Paulo"
  city?: string | null;
  state?: string | null;

  status: ScraperJobStatus;

  totalLeads: number;
  withEmail: number;
  withPhone: number;
  withWebsite: number;
  withInstagram: number;

  startedAt: Date;
  finishedAt?: Date | null;

  errorMessage?: string | null;
}

export const scraperJobCreateSchema = z.object({
  query: z.string().min(2),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
});

export const scraperJobUpdateSchema = z.object({
  status: z.enum(["pending", "running", "completed", "failed"]).optional(),
  totalLeads: z.number().int().nonnegative().optional(),
  withEmail: z.number().int().nonnegative().optional(),
  withPhone: z.number().int().nonnegative().optional(),
  withWebsite: z.number().int().nonnegative().optional(),
  withInstagram: z.number().int().nonnegative().optional(),
  startedAt: z.date().optional(),
  finishedAt: z.date().optional().nullable(),
  errorMessage: z.string().optional().or(z.literal("")),
});
