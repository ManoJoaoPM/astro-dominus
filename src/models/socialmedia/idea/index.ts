// src/models/astro/idea/index.ts
import { z } from "zod";

export type IdeaFormat = "reels" | "carousel" | "video" | "ad" | "story";
export type IdeaStatus = "draft" | "validated" | "archived";

export interface IdeaInterface {
  _id?: string;

  clientId: string;
  editorialLineId?: string | null;

  title: string;
  description?: string | null;
  format?: IdeaFormat | null;
  tags?: string[];
  references?: string[];
  notes?: string | null;
  status: IdeaStatus;

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export const ideaFormSchema = z.object({
  clientId: z.string().min(1, "Cliente obrigatório."),
  editorialLineId: z.string().optional().or(z.literal("")),
  title: z.string().min(2, { message: "Título deve ter pelo menos 2 caracteres." }),
  description: z.string().optional().or(z.literal("")),
  format: z.enum(["reels", "carousel", "video", "ad", "story"]).optional(),
  tags: z.array(z.string()).optional(),
  references: z.array(z.string()).optional(),
  notes: z.string().optional().or(z.literal("")),
  status: z.enum(["draft", "validated", "archived"]).default("draft").optional(),
});

export const ideaUpdateSchema = ideaFormSchema.partial();
