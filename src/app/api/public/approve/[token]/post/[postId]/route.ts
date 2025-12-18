import { NextResponse } from "next/server";
import { Client } from "@/models/client/model"; // ajuste o path
import { SocialPost } from "@/models/socialmedia/post/model";

type Body =
  | { action: "approve" }
  | { action: "reject"; reason: string; adjustments?: string };

export async function POST(
  req: Request,
  { params }: { params: { token: string; postId: string } }
) {
  const { token, postId } = params;

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.action || !["approve", "reject"].includes(body.action)) {
    return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
  }

  // 1) valida cliente por token
  const client: any = await Client.findOne({
    approvalToken: token,
    deletedAt: null, // remova se não existir
  }).lean();

  if (!client) {
    return NextResponse.json({ ok: false, error: "Invalid token" }, { status: 404 });
  }

  const clientId = String(client.id ?? client._id);

  // 2) encontra post
  const post = await SocialPost.findOne({ _id: postId, deletedAt: null });
  if (!post) {
    return NextResponse.json({ ok: false, error: "Post not found" }, { status: 404 });
  }

  // 3) segurança: post deve pertencer ao cliente do token
  if (String(post.clientId) !== clientId) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  // 4) segurança: só decide se estiver pendente
  if (post.status !== "pending") {
    return NextResponse.json({ ok: false, error: "Already decided" }, { status: 409 });
  }

  // 5) aplica ação
  if (body.action === "approve") {
    post.status = "approved";
    post.rejectionReason = null;
    post.revisionRequest = null;
  } else {
    const reason = (body.reason || "").trim();
    if (!reason) {
      return NextResponse.json({ ok: false, error: "Reason required" }, { status: 400 });
    }

    post.status = "rejected";
    post.rejectionReason = reason;

    const adjustments = (body.adjustments || "").trim();
    post.revisionRequest = adjustments || reason;
  }

  post.updatedAt = new Date();
  await post.save();

  return NextResponse.json({ ok: true });
}
