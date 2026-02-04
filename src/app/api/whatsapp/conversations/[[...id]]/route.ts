import { Conversation } from "@/models/whatsapp/conversation/model";
import { WhatsAppInstance } from "@/models/whatsapp/instance/model";
import { CRUDController } from "@/struct";
import { NextRequest, NextResponse } from "next/server";
import { startConnection, ObjectId } from "@/lib/mongoose";
import { WhatsAppSyncService } from "@/services/whatsapp/sync";

const controller = new CRUDController(Conversation, {
  roles: {
    GET: ["admin", "operational", "commercial"],
    PATCH: ["admin", "operational", "commercial"],
  },
  sort: { lastMessageAt: -1 }, // Sort by most recent activity
  hooks: {
    beforeGet: async ({ query }) => {
      // Typically we filter by instanceId, which is linked to clientId
      // Frontend should pass ?instanceId=...
      if (query.instanceId && query.instanceId !== "undefined") {
        const instanceObjectId = new ObjectId(query.instanceId as string);
        query.instanceId = instanceObjectId;

        const dbInstance = await WhatsAppInstance.findById(instanceObjectId);
        if (dbInstance) {
          WhatsAppSyncService.syncRecent(dbInstance).catch(() => {});
        }
      }

      if (query.source && query.source !== "all") {
        query.source = query.source;
      }

      if (query.isPinned === "true") {
        query.isPinned = true;
      }

      if (!query.remoteJid) {
        const filters = [
          { remoteJid: { $ne: "status@broadcast" } },
          { remoteJid: { $not: /@g\.us$/ } },
          { remoteJid: /@(s\.whatsapp\.net|c\.us)$/ },
        ];
        query.$and = Array.isArray(query.$and) ? [...query.$and, ...filters] : filters;
      }
    }
  }
});

export const GET = controller.GET;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id?: string[] }> }
) {
  try {
    await startConnection();
    const { id } = await context.params;
    const conversationId = id?.[0];
    if (!conversationId) return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });
    
    const body = await req.json();
    const { source, isPinned } = body;
    
    const update: any = {};
    if (source !== undefined) update.source = source;
    if (isPinned !== undefined) update.isPinned = isPinned;
    
    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { $set: update },
      { new: true }
    );
    
    if (!conversation) {
      return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });
    }
    
    return NextResponse.json(conversation);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
