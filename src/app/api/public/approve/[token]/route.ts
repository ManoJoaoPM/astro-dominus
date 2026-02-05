import { NextRequest, NextResponse } from "next/server";
import { Client } from "@/models/client/model";
import { SocialPost } from "@/models/socialmedia/post/model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(status: number, data: any) {
  return NextResponse.json(data, { status });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token) {
    return json(400, { ok: false, error: "Missing token" });
  }

  const client: any = await Client.findOne({
    approvalToken: token,
    deletedAt: null,
  }).lean();

  if (!client) {
    return json(404, { ok: false, error: "Invalid token" });
  }

  const clientId = String(client.id ?? client._id);
  if (!clientId || clientId === "undefined") {
    return json(500, { ok: false, error: "Client id not found" });
  }

  const posts = await SocialPost.find({
    clientId,
    status: "pending",
    deletedAt: null,
  })
    .sort({ publishDate: 1 })
    .lean();

  return json(200, {
    ok: true,
    client: { id: clientId, name: client.name },
    posts: posts.map((p: any) => ({
      _id: String(p._id),
      clientId: p.clientId,
      format: p.format,
      title: p.title,
      internalNotes: p.internalNotes ?? null,
      caption: p.caption,
      publishDate: p.publishDate,
      contentFolderUrl: p.contentFolderUrl ?? null,
      mediaUrls: Array.isArray(p.mediaUrls) ? p.mediaUrls : [],
      status: p.status,
    })),
  });
}
