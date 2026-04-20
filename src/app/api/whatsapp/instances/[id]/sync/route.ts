import { NextRequest, NextResponse } from "next/server";
import { WhatsAppInstance } from "@/models/whatsapp/instance/model";
import { WhatsAppSyncService } from "@/services/whatsapp/sync";
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
    
    // Trigger full sync in background (or await if you want to show progress)
    await WhatsAppSyncService.fullSync(dbInstance);
    
    return NextResponse.json({ success: true, message: "Sincronização concluída" });
  } catch (error: any) {
    console.error("Sync Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
