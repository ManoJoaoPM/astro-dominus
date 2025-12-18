import { NextRequest, NextResponse } from "next/server";
import { Client } from "@/models/client/model";
import { SocialPost } from "@/models/socialmedia/post/model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body =
  | { action: "approve" }
  | { action: "reject"; reason: string; adjustments?: string };

function json(status: number, data: any) {
  return NextResponse.json(data, { status });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string; postId: string }> }
) {
  const { token, postId } = await params;

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.action || !["approve", "reject"].includes(body.action)) {
    return json(400, { ok: false, error: "Invalid action" });
  }

  // 1) valida cliente por token
  const client: any = await Client.findOne({
    approvalToken: token,
    deletedAt: null,
  }).lean();

  if (!client) {
    return json(404, { ok: false, error: "Invalid token" });
  }

  const clientId = String(client.id ?? client._id);

  // 2) encontra post
  const post = await SocialPost.findOne({ _id: postId, deletedAt: null });
  if (!post) {
    return json(404, { ok: false, error: "Post not found" });
  }

  // 3) segurança: post deve pertencer ao cliente do token
  if (String(post.clientId) !== clientId) {
    return json(403, { ok: false, error: "Forbidden" });
  }

  // 4) segurança: só decide se estiver pendente
  if (post.status !== "pending") {
    return json(409, { ok: false, error: "Already decided" });
  }

  // 5) aplica ação
  if (body.action === "approve") {
    post.status = "approved";
    post.rejectionReason = null;
    post.revisionRequest = null;
  } else {
    const reason = (body.reason || "").trim();
    if (!reason) {
      return json(400, { ok: false, error: "Reason required" });
    }

    post.status = "rejected";
    post.rejectionReason = reason;

    const adjustments = (body.adjustments || "").trim();
    post.revisionRequest = adjustments || reason;
  }

  post.updatedAt = new Date();
  await post.save();

  return json(200, { ok: true });
}
