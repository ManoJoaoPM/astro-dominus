import { z } from "zod";
import { Types } from "mongoose";

export interface WhatsAppInstanceInterface {
  _id?: string;
  clientId: string | Types.ObjectId;
  instanceName: string; // Unique ID in Evolution (usually clientId)
  status: "connecting" | "connected" | "disconnected" | "error";
  qrCode?: string; // Base64 QR Code (transient)
  evolutionId?: string; // Internal ID from Evolution
  phoneNumber?: string;
  profileName?: string;
  profilePicUrl?: string;
  
  lastActivityAt?: Date;
  lastWebhookAt?: Date;
  lastWebhookEvent?: string;
  lastWebhookError?: string;
  logs?: {
    event: string;
    timestamp: Date;
    details?: any;
  }[];
  
  createdAt?: Date;
  updatedAt?: Date;
}

export const whatsAppInstanceSchema = z.object({
  clientId: z.string(),
  instanceName: z.string(),
  status: z.enum(["connecting", "connected", "disconnected", "error"]),
  qrCode: z.string().optional(),
  phoneNumber: z.string().optional(),
  profileName: z.string().optional(),
  lastActivityAt: z.date().optional(),
  lastWebhookAt: z.date().optional(),
  lastWebhookEvent: z.string().optional(),
  lastWebhookError: z.string().optional(),
});
