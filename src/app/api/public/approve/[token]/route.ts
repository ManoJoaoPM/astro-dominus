import { NextResponse } from "next/server";
import { Client } from "@/models/client/model";
import { SocialPost } from "@/models/socialmedia/post/model";

export async function GET(req: Request) {
  // ✅ pega o token do path: /api/public/approve/[token]
  const token = new URL(req.url).pathname.split("/").pop() || "";

  if (!token) {
    return NextResponse.json({ ok: false, error: "Missing token" }, { status: 400 });
  }

  // 1) cliente pelo token
  const client: any = await Client.findOne({
    approvalToken: token,
    deletedAt: null, // remova se seu Client não tiver isso
  }).lean();

  if (!client) {
    return NextResponse.json({ ok: false, error: "Invalid token" }, { status: 404 });
  }

  // 2) id do cliente (prioriza id, cai pra _id se existir)
  const clientId = String(client.id ?? client._id);
  if (!clientId || clientId === "undefined") {
    return NextResponse.json({ ok: false, error: "Client id not found" }, { status: 500 });
  }

  // 3) posts pendentes
  const posts = await SocialPost.find({
    clientId,
    status: "pending",
    deletedAt: null,
  })
    .sort({ publishDate: 1 })
    .lean();

  // 4) retorno sanitizado (sem depender do Struct)
  return NextResponse.json({
    ok: true,
    client: {
      id: clientId,
      name: client.name,
    },
    posts: posts.map((p: any) => ({
      _id: String(p._id),
      clientId: p.clientId,
      format: p.format,
      title: p.title,
      internalNotes: p.internalNotes ?? null,
      caption: p.caption,
      publishDate: p.publishDate,
      contentFolderUrl: p.contentFolderUrl ?? null,
      coverUrl: p.coverUrl ?? null,
      status: p.status,
    })),
  });
}
