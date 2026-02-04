import { NextResponse } from "next/server";
import { WhatsAppInstance } from "@/models/whatsapp/instance/model";
import { EvolutionApi } from "@/services/evolution/api";
import { startConnection, ObjectId } from "@/lib/mongoose";
import { WhatsAppSyncService } from "@/services/whatsapp/sync";

const evolution = new EvolutionApi();

export async function GET(req: Request) {
  try {
    await startConnection();
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json({ error: "clientId required" }, { status: 400 });
    }

    // Find ALL instances for this client
    const instances = await WhatsAppInstance.find({ clientId: new ObjectId(clientId) });

    if (instances.length === 0) {
      return NextResponse.json({ data: [], results: [] });
    }

    // Refresh status for each instance
    const refreshedInstances = await Promise.all(instances.map(async (instance) => {
      if (instance.instanceName) {
        try {
          // 1. Check Connection State using the dedicated endpoint
          const connectionState = await evolution.getConnectionState(instance.instanceName);
          
          let newStatus = instance.status;
          let newQr = instance.qrCode;

          const state = connectionState?.instance?.state || connectionState?.state;

          if (state === "open") {
             newStatus = "connected";
             newQr = undefined;
          } else if (state === "connecting" || state === "close") {
              // Try to fetch a new QR if it's not connected
              const conn = await evolution.connectInstance(instance.instanceName);
              newStatus = "connecting";
              newQr = conn?.qrcode?.base64 || conn?.base64 || conn?.qrcode;
           }

          // 2. Verify Webhook configuration
          const appUrl = process.env.NEXT_PUBLIC_APP_URL;
          if (appUrl) {
            try {
              const webhookUrl = `${appUrl}/api/webhooks/evolution`;
              const currentWebhook = await evolution.findWebhook(instance.instanceName);
              
              if (!currentWebhook || currentWebhook.url !== webhookUrl) {
                console.log(`[Refresh] Ajustando webhook para ${instance.instanceName}`);
                await evolution.setWebhook(instance.instanceName, webhookUrl);
              }
            } catch (webhookErr) {
              console.warn(`[Refresh] Erro ao validar webhook para ${instance.instanceName}`, webhookErr);
            }
          }

          if (newStatus !== instance.status || newQr !== instance.qrCode) {
            instance.status = newStatus;
            instance.qrCode = newQr;
            await instance.save();
          }

          // 3. Trigger sync if connected
          if (newStatus === "connected") {
            WhatsAppSyncService.syncRecent(instance).catch(e => console.error("[Refresh] Sync Error:", e));
          }
        } catch (err) {
          console.warn(`[Refresh] Error checking status for ${instance.instanceName}:`, err);
        }
      }
      return instance;
    }));

    return NextResponse.json({ data: refreshedInstances, results: refreshedInstances });

  } catch (error: any) {
    console.error("Refresh Instance Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
