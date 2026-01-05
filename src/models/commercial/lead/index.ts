import { z } from "zod";

export type CommercialLeadSource = "scraper" | "manual";
export type CommercialLeadQualificationStatus =
  | "pending"
  | "qualified"
  | "unqualified";

export interface CommercialLeadInterface {
  _id?: string;

  // Dados básicos da imobiliária
  name: string;
  city?: string | null;
  state?: string | null;
  address?: string | null;

  phone?: string | null;
  email?: string | null;
  website?: string | null;
  instagram?: string | null;

  // De onde veio esse lead (scraper, inserção manual, etc.)
  source: CommercialLeadSource;

  // Qualificação
  qualificationStatus: CommercialLeadQualificationStatus;
  qualificationNotes?: string | null;

  // Relacionamento com o ScraperJob (opcional)
  scraperJobId?: string | null;

  // Mapa de Leads
  lat?: number | null;
  lng?: number | null;
  geocodeStatus?: "pending" | "ok" | "failed";

  createdAt: Date;
  updatedAt: Date;
}

export const commercialLeadFormSchema = z.object({
  name: z.string().min(2, { message: "Nome da imobiliária deve ter ao menos 2 caracteres." }),

  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),

  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
  instagram: z.string().optional().or(z.literal("")),

  source: z.enum(["scraper", "manual"]).default("scraper"),

  qualificationStatus: z
    .enum(["pending", "qualified", "unqualified"])
    .default("pending"),

  qualificationNotes: z.string().optional().or(z.literal("")),

  scraperJobId: z.string().optional().or(z.literal("")),

  lat: z.number().optional(),
  lng: z.number().optional(),
  geocodeStatus: z.enum(["pending","ok","failed"]).default("pending")

});

export const commercialLeadUpdateSchema = z.object({
  name: z.string().min(2).optional(),

  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),

  phone: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
  instagram: z.string().optional().or(z.literal("")),

  qualificationStatus: z
    .enum(["pending", "qualified", "unqualified"])
    .optional(),

  qualificationNotes: z.string().optional().or(z.literal("")),

  scraperJobId: z.string().optional().or(z.literal("")),
});
