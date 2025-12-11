// src/models/astro/client/index.ts
import { z } from "zod";

export type ClientStatus = "active" | "paused" | "closed";

export interface ClientInterface {
  _id?: string;

  name: string;
  responsible: string;
  email: string;
  phone?: string | null;
  whatsapp?: string | null;
  cnpj?: string | null;
  city?: string | null;
  state?: string | null;
  website?: string | null;
  portals?: string[];

  niche?: string | null;
  regions?: string[];
  differentials?: string | null;
  targetAudience?: string | null;
  toneOfVoice?: string | null;
  forbiddenWords?: string[];

  brandColors?: string[];
  logoUrl?: string | null;
  brandFonts?: string[];

  documents?: { type?: string | null; url: string }[];

  approvalToken: string;

  status: ClientStatus;

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

// FORM principal (cadastro/edição completa)
export const clientFormSchema = z.object({
  name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres." }),
  responsible: z.string().min(2, { message: "Responsável deve ter pelo menos 2 caracteres." }),
  email: z.string().email({ message: "Email inválido." }),

  phone: z.string().optional().or(z.literal("")),
  whatsapp: z.string().optional().or(z.literal("")),
  cnpj: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
  portals: z.array(z.string()).optional(),

  niche: z.string().optional().or(z.literal("")),
  regions: z.array(z.string()).optional(),
  differentials: z.string().optional().or(z.literal("")),
  targetAudience: z.string().optional().or(z.literal("")),
  toneOfVoice: z.string().optional().or(z.literal("")),
  forbiddenWords: z.array(z.string()).optional(),

  brandColors: z.array(z.string()).optional(),
  logoUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  brandFonts: z.array(z.string()).optional(),

  documents: z
    .array(
      z.object({
        type: z.string().optional().or(z.literal("")),
        url: z.string().url("URL inválida"),
      })
    )
    .optional(),

  status: z.enum(["active", "paused", "closed"]).default("active").optional(),
});

// UPDATE mais leve (para updates rápidos)
export const clientUpdateSchema = z.object({
  status: z.enum(["active", "paused", "closed"]).optional(),
  niche: z.string().optional(),
  targetAudience: z.string().optional(),
  toneOfVoice: z.string().optional(),
});
