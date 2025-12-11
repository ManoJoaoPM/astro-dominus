// src/models/astro/pauta/index.ts
import { z } from "zod";

export interface PautaInterface {
  _id?: string;

  clientId: string;
  editorialLineId?: string | null;

  title: string;
  copy?: string | null;
  hooks?: string[];
  cta?: string | null;
  structure?: string | null;
  references?: string[];
  notes?: string | null;

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export const pautaFormSchema = z.object({
  clientId: z.string().min(1, "Cliente obrigatório."),
  editorialLineId: z.string().optional().or(z.literal("")),
  title: z.string().min(2, { message: "Título deve ter pelo menos 2 caracteres." }),
  copy: z.string().optional().or(z.literal("")),
  hooks: z.array(z.string()).optional(),
  cta: z.string().optional().or(z.literal("")),
  structure: z.string().optional().or(z.literal("")),
  references: z.array(z.string()).optional(),
  notes: z.string().optional().or(z.literal("")),
});

export const pautaUpdateSchema = pautaFormSchema.partial();
