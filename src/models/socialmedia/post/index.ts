import { z } from "zod";

export type SocialPostFormat =
  | "carousel"
  | "reels"
  | "static"
  | "video"
  | "ad"
  | "other";

export type SocialPostStatus =
  | "pending"        // Aguardando aprovação
  | "approved"       // Aprovado
  | "rejected"       // Reprovado
  | "revision_sent"; // Revisão enviada

export interface SocialPostInterface {
  _id?: string;

  clientId: string;

  format: SocialPostFormat;
  title: string;
  internalNotes?: string | null;
  caption: string;
  publishDate: Date;

  contentFolderUrl?: string | null;
  coverUrl?: string | null;

  status: SocialPostStatus;

  rejectionReason?: string | null;
  revisionRequest?: string | null;

  publicApprovalToken?: string | null;
  publicApprovalEnabled?: boolean;
  publicApprovalExpiresAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export const socialPostFormSchema = z.object({
  clientId: z.string().min(1, "Cliente obrigatório."),

  format: z.enum(["carousel", "reels", "static", "video", "ad", "other"]),
  title: z.string().min(2, { message: "Título deve ter pelo menos 2 caracteres." }),

  internalNotes: z.string().optional().or(z.literal("")),
  caption: z.string().min(2, { message: "Legenda é obrigatória." }),

  // coerce: aceita string e transforma em Date
  publishDate: z.coerce.date(),

  contentFolderUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  coverUrl: z.string().url("URL inválida").optional().or(z.literal("")),

  status: z
    .enum(["pending", "approved", "rejected", "revision_sent"])
    .default("pending")
    .optional(),

  rejectionReason: z.string().optional().or(z.literal("")),
  revisionRequest: z.string().optional().or(z.literal("")),

  publicApprovalEnabled: z.boolean().optional(),
  publicApprovalToken: z.string().optional().or(z.literal("")),
  publicApprovalExpiresAt: z.coerce.date().optional(),

});

export const socialPostUpdateSchema = socialPostFormSchema.partial();
