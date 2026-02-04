import { z } from "zod";
import { Types } from "mongoose";

export type MarketingProvider = "meta" | "google";
export type IntegrationStatus = "active" | "error" | "disconnected";

export interface MarketingIntegrationInterface {
  _id?: string;
  clientId: string | Types.ObjectId; // Reference to Client
  provider: MarketingProvider;
  name: string; // e.g., "Meta Ads - Conta X"
  
  // Auth & Config
  adAccountId: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  
  status: IntegrationStatus;
  errorMessage?: string | null;
  
  lastSyncAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const marketingIntegrationSchema = z.object({
  clientId: z.string(),
  provider: z.enum(["meta", "google"]),
  name: z.string().min(1, "Nome é obrigatório"),
  adAccountId: z.string().min(1, "ID da conta é obrigatório"),
  accessToken: z.string().optional(),
  status: z.enum(["active", "error", "disconnected"]).default("active"),
});
