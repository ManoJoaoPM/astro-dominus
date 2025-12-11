"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import Image from "next/image";
import { useState } from "react";
import type { ClientInterface } from "@/models/client";
import type { SocialPostInterface } from "@/models/socialmedia/post";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatFormat(value: SocialPostInterface["format"]) {
  if (value === "carousel") return "Carrossel";
  if (value === "reels") return "Reels";
  if (value === "static") return "Post estático";
  if (value === "video") return "Vídeo";
  if (value === "ad") return "Anúncio";
  return "Outro";
}

type ApprovalCardProps = {
  post: SocialPostInterface;
  onApproved: (postId: string) => Promise<void>;
  onRejected: (
    postId: string,
    data: { reason: string; adjustments?: string }
  ) => Promise<void>;
};

function ApprovalCard({ post, onApproved, onRejected }: ApprovalCardProps) {
  const [isRejecting, setIsRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [adjustments, setAdjustments] = useState("");
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    try {
      setError(null);
      setLoading("approve");
      await onApproved(post._id!);
    } catch {
      setError("Erro ao aprovar. Tente novamente.");
    } finally {
      setLoading(null);
    }
  }

  async function handleReject(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Por favor, informe o motivo da recusa.");
      return;
    }
    try {
      setError(null);
      setLoading("reject");
      await onRejected(post._id!, {
        reason: reason.trim(),
        adjustments: adjustments.trim() || reason.trim(),
      });
      setIsRejecting(false);
      setReason("");
      setAdjustments("");
    } catch {
      setError("Erro ao recusar. Tente novamente.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <article className="rounded-xl border bg-white shadow-sm p-4 flex flex-col gap-3">
      {post.coverUrl && (
        <div className="relative w-full h-44 rounded-md overflow-hidden bg-slate-100">
          <Image
            src={post.coverUrl}
            alt={post.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="space-y-1">
        <p className="text-[11px] font-medium text-slate-500">
          {formatFormat(post.format)}
        </p>
        <p className="text-sm font-semibold text-slate-900">{post.title}</p>
        <p className="text-[11px] text-slate-500">
          Publicação prevista:{" "}
          {new Date(post.publishDate).toLocaleDateString("pt-BR")}
        </p>
      </div>

      {post.internalNotes && (
        <div className="rounded-md bg-slate-50 p-2 text-[11px] space-y-1">
          <p className="font-medium text-slate-700">Descrição do post</p>
          <p className="text-slate-600 whitespace-pre-line">
            {post.internalNotes}
          </p>
        </div>
      )}

      <div className="rounded-md bg-slate-50 p-2 text-[11px] space-y-1">
        <p className="font-medium text-slate-700">Legenda sugerida</p>
        <p className="text-slate-600 whitespace-pre-line">
          {post.caption}
        </p>
      </div>

      {error && (
        <p className="text-[11px] text-red-600">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2 pt-2 border-t border-slate-200">
        {!isRejecting && (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setIsRejecting(true)}
              className="rounded-md border border-red-200 px-3 py-1.5 text-[11px] text-red-700 hover:bg-red-50 transition"
              disabled={loading !== null}
            >
              Reprovar
            </button>
            <button
              onClick={handleApprove}
              className="rounded-md border border-emerald-500 bg-emerald-500 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-emerald-600 transition"
              disabled={loading !== null}
            >
              {loading === "approve" ? "Aprovando..." : "Aprovar"}
            </button>
          </div>
        )}

        {isRejecting && (
          <form
            onSubmit={handleReject}
            className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-2"
          >
            <p className="text-[11px] font-medium text-slate-700">
              Motivo da recusa
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] outline-none focus:ring-1 focus:ring-slate-400 resize-y min-h-[60px]"
              placeholder="Explique por que este conteúdo não foi aprovado."
            />

            <p className="text-[11px] font-medium text-slate-700">
              Ajustes desejados{" "}
              <span className="text-slate-400">(opcional)</span>
            </p>
            <textarea
              value={adjustments}
              onChange={(e) => setAdjustments(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] outline-none focus:ring-1 focus:ring-slate-400 resize-y min-h-[60px]"
              placeholder="Descreva como você gostaria que o post fosse ajustado."
            />

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsRejecting(false);
                  setReason("");
                  setAdjustments("");
                  setError(null);
                }}
                className="text-[11px] text-slate-500 hover:underline"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-md border border-red-500 bg-red-500 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-red-600 transition"
                disabled={loading === "reject"}
              >
                {loading === "reject" ? "Enviando..." : "Enviar recusa"}
              </button>
            </div>
          </form>
        )}
      </div>
    </article>
  );
}

export default function PublicApprovalPage() {
  const { token } = useParams() as { token: string };

  // 1) Buscar cliente pelo token
  const { data: clients } = useSWR<ClientInterface[]>(
    `/api/client?approvalToken=${token}`,
    fetcher
  );
  const client = clients?.[0];

  // 2) Buscar posts pendentes desse cliente
  const { data: posts } = useSWR<SocialPostInterface[]>(
    client ? `/api/social-post?clientId=${client._id}&status=pending` : null,
    fetcher
  );

  async function approve(postId: string) {
    await fetch(`/api/social-post/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved" }),
    });
  }

  async function reject(
    postId: string,
    data: { reason: string; adjustments?: string }
  ) {
    await fetch(`/api/social-post/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "rejected",
        rejectionReason: data.reason,
        revisionRequest: data.adjustments ?? data.reason,
      }),
    });
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="w-full border-b bg-white">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-semibold text-slate-900">
              Aprovação de conteúdos
            </h1>
            <p className="text-[11px] text-slate-500">
              Revise os posts preparados pela equipe Dominus e aprove ou solicite ajustes.
            </p>
            {client && (
              <p className="mt-1 text-[11px] text-slate-600">
                Cliente: <span className="font-medium">{client.name}</span>
              </p>
            )}
          </div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wide">
            Astro Dominus
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-5 space-y-4">
        {!client && (
          <p className="text-sm text-slate-500">
            Carregando informações do cliente...
          </p>
        )}

        {client && posts && posts.length === 0 && (
          <p className="text-sm text-slate-500">
            No momento, não há conteúdos pendentes de aprovação.
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {posts?.map((post) => (
            <ApprovalCard
              key={post._id}
              post={post}
              onApproved={approve}
              onRejected={reject}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
