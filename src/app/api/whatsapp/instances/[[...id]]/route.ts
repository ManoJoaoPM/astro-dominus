import { WhatsAppInstance, whatsAppInstanceSchema } from "@/models/whatsapp/instance/model";
import { CRUDController } from "@/struct";
import { EvolutionApi } from "@/services/evolution/api";
import { nanoid } from "nanoid";
import { ObjectId } from "@/lib/mongoose";

const evolution = new EvolutionApi();

export const {
  GET,
  POST,
  DELETE,
  dynamic,
  runtime,
} = new CRUDController(WhatsAppInstance, {
  createSchema: whatsAppInstanceSchema,
  roles: {
    GET: ["admin", "operational", "commercial"],
    POST: ["admin", "operational"],
    DELETE: ["admin", "operational"],
  },
  hooks: {
    beforeGet: async ({ query }) => {
      // Filter by clientId
      if (query.clientId && query.clientId !== "undefined") {
        query.clientId = new ObjectId(query.clientId as string);
      }

      if (query.status === "connecting") {
        try {
          const connectionData = await evolution.connectInstance(query.instanceName);
          query.qrCode = connectionData?.qrcode?.base64 || connectionData?.base64 || connectionData?.qrcode;
        } catch (error) {
          console.log("[API] Error connecting instance:", error);
        }
      }

      
    },
    beforeCreate: async ({ data }) => {
      // 1. Create instance in Evolution
      // Use a unique name: client-{clientId}-{random}
      const instanceName = `client-${data.clientId}-${nanoid(6)}`;
      
      // We assume the app URL is available in ENV for webhook
      const appUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (!appUrl) {
        throw new Error("NEXT_PUBLIC_APP_URL não configurada. Necessária para receber mensagens via webhook.");
      }
      const webhookUrl = `${appUrl}/api/webhooks/evolution`;
      
      console.log("[API] Creating instance with Evolution:", instanceName);
      const createRes = await evolution.createInstance(instanceName, webhookUrl);
      console.log("[API] Instance created response:", createRes);
      
      // 2. Fetch QR Code immediately
      console.log("[API] Connecting instance:", instanceName);
      const connectionData = await evolution.connectInstance(instanceName);
      console.log("[API] Connection data received:", JSON.stringify(connectionData, null, 2));
      
      data.instanceName = instanceName;
      data.status = "connecting";
      // Handle different Evolution API response formats
      data.qrCode = connectionData?.qrcode?.base64 || connectionData?.base64 || connectionData?.qrcode; 
      console.log("[API] Extracted QR Code length:", data.qrCode?.length);
      
      return data;
    },
    beforeDelete: async ({ original }) => {
      // Delete from Evolution
      if (original?.instanceName) {
        await evolution.deleteInstance(original.instanceName);
      }
    }
  }
});
