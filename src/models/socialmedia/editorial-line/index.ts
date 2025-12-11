// src/models/astro/editorial-line/index.ts
import { z } from "zod";

export interface EditorialLineInterface {
  _id?: string;

  clientId: string;
  name: string;
  objective?: string | null;
  description?: string | null;
  frequency?: string | null;
  examples?: string[];
  notes?: string | null;

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export const editorialLineFormSchema = z.object({
  clientId: z.string().min(1, "Cliente obrigatório."),
  name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres." }),
  objective: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  frequency: z.string().optional().or(z.literal("")),
  examples: z.array(z.string()).optional(),
  notes: z.string().optional().or(z.literal("")),
});

export const editorialLineUpdateSchema = editorialLineFormSchema.partial();
