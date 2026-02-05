import { z } from "zod";
import { Types } from "mongoose";

export interface ConversationInterface {
  _id?: string;
  instanceId: string | Types.ObjectId;
  remoteJid: string; // Phone number with @s.whatsapp.net
  contactName?: string;
  profilePicUrl?: string;
  
  lastMessageContent?: string;
  lastMessageAt?: Date;
  unreadCount: number;
  
  source: "Orgânico" | "Google Ads" | "Meta Ads" | "Não identificado";
  metaAdsCtwaClid?: string;
  metaAdsSourceId?: string;
  metaAdsShowAdAttribution?: boolean;
  isPinned: boolean;
  firstContactAt?: Date;
  lastMessagePreview?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const conversationSchema = z.object({
  instanceId: z.string(),
  remoteJid: z.string(),
  contactName: z.string().optional(),
  lastMessageContent: z.string().optional(),
  unreadCount: z.number().default(0),
  source: z.enum(["Orgânico", "Google Ads", "Meta Ads", "Não identificado"]).default("Não identificado"),
  metaAdsCtwaClid: z.string().optional(),
  metaAdsSourceId: z.string().optional(),
  metaAdsShowAdAttribution: z.boolean().optional(),
  isPinned: z.boolean().default(false),
  firstContactAt: z.date().optional(),
  lastMessagePreview: z.string().optional(),
});
