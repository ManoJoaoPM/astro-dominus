// src/models/astro/monthly-plan/index.ts
import { z } from "zod";

export interface MonthlyPlanItem {
  day: number;
  editorialLineId?: string | null;
  format?: string | null;
  notes?: string | null;
  pautaId?: string | null;
}

export interface MonthlyPlanInterface {
  _id?: string;

  clientId: string;
  month: number;
  year: number;
  items: MonthlyPlanItem[];

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export const monthlyPlanFormSchema = z.object({
  clientId: z.string().min(1, "Cliente obrigatório."),
  month: z.number().min(1).max(12),
  year: z.number().min(2000),
  items: z
    .array(
      z.object({
        day: z.number().min(1).max(31),
        editorialLineId: z.string().optional().or(z.literal("")),
        format: z.string().optional().or(z.literal("")),
        notes: z.string().optional().or(z.literal("")),
        pautaId: z.string().optional().or(z.literal("")),
      })
    )
    .optional()
    .default([]),
});

export const monthlyPlanUpdateSchema = monthlyPlanFormSchema.partial();
