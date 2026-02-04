import { NextRequest, NextResponse } from "next/server";
import { WhatsAppInstance } from "@/models/whatsapp/instance/model";
import { EvolutionApi } from "@/services/evolution/api";
import { startConnection } from "@/lib/mongoose";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await startConnection();
    const { id } = await context.params;
    
    const dbInstance = await WhatsAppInstance.findById(id);
    if (!dbInstance) {
      return NextResponse.json({ error: "Instância não encontrada" }, { status: 404 });
    }
    
    const evolution = new EvolutionApi();
    
    // 1. Try to fetch connection to get a new QR
    const result = await evolution.connectInstance(dbInstance.instanceName);
    
    // 2. Update status in DB
    dbInstance.status = "connecting";
    if (result?.base64) {
      dbInstance.qrCode = result.base64;
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
}
