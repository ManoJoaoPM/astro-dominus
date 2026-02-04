import { NextRequest, NextResponse } from "next/server";
import { WhatsAppInstance } from "@/models/whatsapp/instance/model";
import { WhatsAppSyncService } from "@/services/whatsapp/sync";
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
    
    // Trigger full sync in background (or await if you want to show progress)
    await WhatsAppSyncService.fullSync(dbInstance);
    
    return NextResponse.json({ success: true, message: "Sincronização concluída" });
  } catch (error: any) {
    console.error("Sync Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
