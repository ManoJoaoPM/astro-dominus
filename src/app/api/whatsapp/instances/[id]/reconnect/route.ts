import { NextRequest, NextResponse } from "next/server";
import { WhatsAppInstance } from "@/models/whatsapp/instance/model";
import { EvolutionApi } from "@/services/evolution/api";
import { startConnection } from "@/lib/mongoose";
import { withSession } from "@/struct";

export const POST = withSession(async ({ user }, req: NextRequest, context: any) => {
  try {
    if (!user || !["admin", "operational"].includes(user.role as string)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await startConnection();
    const params = await context?.params;
    const id = params?.id as string | undefined;
    if (!id) {
      return NextResponse.json({ error: "Instância não informada" }, { status: 400 });
    }
    
    const dbInstance = await WhatsAppInstance.findById(id);
    if (!dbInstance) {
      return NextResponse.json({ error: "Instância não encontrada" }, { status: 404 });
    }
    
    const evolution = new EvolutionApi();
    
    // 1. Try to fetch connection to get a new QR
    const result = await evolution.connectInstance(dbInstance.instanceName);
    
    // 2. Update status in DB
    dbInstance.status = "connecting";
    const qrCode =
      result?.qrcode?.base64 ||
      result?.qrcode?.qrcode ||
      result?.qrcode?.code ||
      result?.base64 ||
      result?.qrCode ||
      result?.qr ||
      result?.qrcode;
    if (qrCode) {
      dbInstance.qrCode = qrCode;
    }
    
    dbInstance.logs?.push({
      event: "RECONNECT_REQUESTED",
      timestamp: new Date(),
    });
    
    await dbInstance.save();
    
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Reconnect Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
