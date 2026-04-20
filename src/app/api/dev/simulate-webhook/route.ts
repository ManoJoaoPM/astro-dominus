import { NextResponse } from "next/server";
import { WhatsAppInstance } from "@/models/whatsapp/instance/model";
import { startConnection } from "@/lib/mongoose";
import axios from "axios";
import { withSession } from "@/struct";
import { ENV } from "@/env";

export const GET = withSession(async ({ user }, req: Request) => {
  try {
    if ((ENV.NODE_ENV || process.env.NODE_ENV) !== "development") {
      return NextResponse.json({ message: "Not Found" }, { status: 404 });
    }
    if (!user || !["admin", "operational"].includes(user.role as string)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await startConnection();
    const { searchParams } = new URL(req.url);
    const text = searchParams.get("text") || "Mensagem de teste automática";
    const phone = searchParams.get("phone") || "5511999999999";
    const remoteJid = `${phone}@s.whatsapp.net`;
    const fromMe = searchParams.get("fromMe") === "true";

    // 1. Find any active instance
    const instance = await WhatsAppInstance.findOne({ status: { $in: ["connected", "connecting"] } });

    if (!instance) {
      return NextResponse.json({ 
        error: "Nenhuma instância conectada encontrada no banco de dados. Crie uma instância primeiro." 
      }, { status: 404 });
    }

    // 2. Construct Webhook Payload (Evolution API format)
    const payload = {
      event: "MESSAGES_UPSERT",
      instance: instance.instanceName,
      data: {
        key: {
          remoteJid,
          fromMe,
          id: `TEST-${Date.now()}`
        },
        pushName: "Usuário de Teste",
        message: {
          conversation: text
        },
        messageType: "conversation",
        messageTimestamp: Math.floor(Date.now() / 1000)
      },
      sender: remoteJid
    };

    // 3. Send to our own Webhook Handler
    // We use the absolute URL of the running app
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    console.log(`[Simulator] Sending webhook to ${appUrl}/api/webhooks/evolution`);
    
    try {
      const secret = ENV.EVOLUTION_WEBHOOK_SECRET || process.env.EVOLUTION_WEBHOOK_SECRET;
      await axios.post(`${appUrl}/api/webhooks/evolution`, payload, {
        headers: secret ? { "x-evolution-webhook-secret": String(secret) } : undefined,
      });
      return NextResponse.json({ 
        success: true, 
        message: "Webhook simulado enviado com sucesso", 
        details: {
          instance: instance.instanceName,
          to: remoteJid,
          text
        }
      });
    } catch (error: any) {
      console.error("[Simulator] Webhook call failed:", error.message);
      return NextResponse.json({ 
        error: "Falha ao chamar o webhook local",
        details: error.message 
      }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
