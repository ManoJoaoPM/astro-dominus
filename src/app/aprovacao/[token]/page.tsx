"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import { useEffect, useRef, useState } from "react";
import type { SocialPostInterface } from "@/models/socialmedia/post";
import { GoogleDriveFolderGrid } from "@/components/GoogleDriveFolderGrid";
import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Bookmark, Check, ChevronLeft, ChevronRight, Heart, MessageCircle, MoreHorizontal, Share2, X } from "lucide-react";
import Image from "next/image";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatFormat(value: SocialPostInterface["format"]) {
  if (value === "carousel") return "Carrossel";
  if (value === "reels") return "Reels";
  if (value === "static") return "Post estático";
  if (value === "video") return "Vídeo";
  if (value === "ad") return "Anúncio";
  return "Outro";
}

function extractDriveFileId(url: string) {
  const s = url.trim();
  const m1 = s.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m1?.[1]) return m1[1];
  const m2 = s.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m2?.[1]) return m2[1];
  const m3 = s.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (m3?.[1]) return m3[1];
  return null;
}

function extractQueryParam(url: string, key: string) {
  const match = url.match(new RegExp(`[?&]${key}=([^&]+)`));
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function normalizeImageUrl(url?: string | null) {
  if (!url) return null;
  const s = url
    .trim()
    .replace(/^["'`]+/, "")
    .replace(/["'`]+$/, "")
    .replace(/&amp;/g, "&");
  if (!s) return null;
  if (s.includes("drive.usercontent.google.com")) return s;
  if (s.includes("drive.google.com") || s.includes("googleusercontent.com") || s.includes("docs.google.com")) {
    const id = extractDriveFileId(s);
    if (id) {
      const resourceKey = extractQueryParam(s, "resourcekey");
      return `https://drive.usercontent.google.com/download?id=${id}&export=view&authuser=0${resourceKey ? `&resourcekey=${encodeURIComponent(resourceKey)}` : ""}`;
    }
  }
  return s;
}

type ApprovalCardProps = {
  post: SocialPostInterface;
  clientName: string;
  onApproved: (postId: string) => Promise<void>;
  onRejected: (postId: string, data: { reason: string; adjustments?: string }) => Promise<void>;
};

function ApprovalCard({ post, clientName, onApproved, onRejected }: ApprovalCardProps) {
  const [isRejecting, setIsRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [adjustments, setAdjustments] = useState("");
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFiles, setShowFiles] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const didDragRef = useRef(false);
  const dragResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const imageCandidates =
    post.format === "carousel" && post.mediaUrls && post.mediaUrls.length > 0
      ? post.mediaUrls
      : post.mediaUrls && post.mediaUrls.length > 0
        ? post.mediaUrls
        : [];

  const images = imageCandidates
    .map((u) => normalizeImageUrl(u))
    .filter(Boolean) as string[];

  const clampedIndex = Math.min(activeIndex, Math.max(0, images.length - 1));
  const canPrev = images.length > 1 && clampedIndex > 0;
  const canNext = images.length > 1 && clampedIndex < images.length - 1;
  const imageSrc =
    images[clampedIndex] ? `/api/media/image-proxy?url=${encodeURIComponent(images[clampedIndex]!)}` : null;

  useEffect(() => {
    if (activeIndex !== clampedIndex) setActiveIndex(clampedIndex);
  }, [activeIndex, clampedIndex]);

  useEffect(() => {
    if (images.length === 0) return;
    const toPreload: number[] = [];
    if (images.length <= 3) {
      for (let i = 0; i < images.length; i++) toPreload.push(i);
    } else if (clampedIndex === 0) {
      toPreload.push(0, 1, 2);
    } else if (clampedIndex === images.length - 1) {
      toPreload.push(images.length - 3, images.length - 2, images.length - 1);
    } else {
      toPreload.push(clampedIndex - 1, clampedIndex, clampedIndex + 1);
    }

    for (const idx of toPreload) {
      const u = images[idx];
      if (!u) continue;
      const src = `/api/media/image-proxy?url=${encodeURIComponent(u)}`;
      const img = new window.Image();
      img.referrerPolicy = "no-referrer";
      img.src = src;
    }
  }, [images, clampedIndex]);

  function goPrev() {
    if (!canPrev) return;
    setActiveIndex((i) => Math.max(0, i - 1));
  }

  function goNext() {
    if (!canNext) return;
    setActiveIndex((i) => Math.min(images.length - 1, i + 1));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
    >
      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8 border">
              <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">
                {clientName.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-xs font-bold leading-tight">{clientName}</span>
              <span className="text-[10px] text-slate-500 leading-tight">{formatFormat(post.format)}</span>
            </div>
          </div>
          <MoreHorizontal className="w-4 h-4 text-slate-400" />
        </div>

        <div className="aspect-square bg-slate-100 relative">
          {imageSrc ? (
            <motion.img
              src={imageSrc}
              alt={post.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              key={imageSrc}
              drag={images.length > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragStart={() => {
                didDragRef.current = false;
                if (dragResetTimeoutRef.current) clearTimeout(dragResetTimeoutRef.current);
              }}
              onDragEnd={(_, info) => {
                const swipe = info.offset.x;
                if (swipe < -80) goNext();
                if (swipe > 80) goPrev();
                if (Math.abs(swipe) > 10) didDragRef.current = true;
                dragResetTimeoutRef.current = setTimeout(() => {
                  didDragRef.current = false;
                }, 250);
              }}
              whileTap={{ cursor: images.length > 1 ? "grabbing" : "auto" }}
              onClick={() => {
                if (!post.contentFolderUrl) return;
                if (didDragRef.current) return;
                window.open(post.contentFolderUrl, "_blank", "noopener,noreferrer");
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
              Sem imagem
            </div>
          )}

          {images.length > 1 && (
            <>
              <div className="absolute top-3 right-3 z-20">
                <div className="rounded-full bg-black/60 text-white text-[10px] font-semibold px-2 py-1">
                  {clampedIndex + 1}/{images.length}
                </div>
              </div>

              {canPrev && (
                <button
                  type="button"
                  onClick={goPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/80 hover:bg-white shadow p-2 transition"
                  aria-label="Imagem anterior"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-800" />
                </button>
              )}

              {canNext && (
                <button
                  type="button"
                  onClick={goNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/80 hover:bg-white shadow p-2 transition"
                  aria-label="Próxima imagem"
                >
                  <ChevronRight className="w-5 h-5 text-slate-800" />
                </button>
              )}

              <div className="absolute bottom-3 inset-x-0 z-20 flex justify-center gap-1.5">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    className={cn(
                      "h-1.5 w-1.5 rounded-full transition",
                      idx === clampedIndex ? "bg-white" : "bg-white/50",
                    )}
                    aria-label={`Ir para imagem ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}

          {post.status !== "pending" && (
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center backdrop-blur-[2px] z-10",
                post.status === "approved" ? "bg-emerald-500/15" : "bg-red-500/15",
              )}
            >
              <div
                className={cn(
                  "p-4 rounded-full shadow-lg border-2",
                  post.status === "approved"
                    ? "bg-emerald-600 text-white border-white"
                    : "bg-red-600 text-white border-white",
                )}
              >
                {post.status === "approved" ? (
                  <Check className="w-8 h-8" />
                ) : (
                  <X className="w-8 h-8" />
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Heart className="w-6 h-6 text-slate-700" />
            <MessageCircle className="w-6 h-6 text-slate-700" />
            <Share2 className="w-6 h-6 text-slate-700" />
          </div>
          <Bookmark className="w-6 h-6 text-slate-700" />
        </div>

        <div className="px-3 pb-4 space-y-2">
          <div className="text-sm whitespace-pre-line">
            <span className="font-bold mr-2">{clientName}</span>
            <span>{post.caption || post.title}</span>
          </div>
          <p className="text-[10px] text-slate-400 uppercase tracking-tight">
            {new Date(post.publishDate).toLocaleDateString("pt-BR")}
          </p>

          {post.internalNotes && (
            <div className="rounded-md bg-slate-50 p-2 text-[11px] space-y-1">
              <p className="font-medium text-slate-700">Descrição interna</p>
              <p className="text-slate-600 whitespace-pre-line">{post.internalNotes}</p>
            </div>
          )}

          {post.contentFolderUrl && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="h-8 text-[11px]"
                asChild
              >
                <a href={post.contentFolderUrl} target="_blank" rel="noreferrer">
                  Abrir arquivos
                </a>
              </Button>
              <Button
                variant="ghost"
                className="h-8 text-[11px]"
                onClick={() => setShowFiles(!showFiles)}
              >
                {showFiles ? "Ocultar" : "Visualizar"}
              </Button>
            </div>
          )}
        </div>

        {showFiles && post.contentFolderUrl && (
          <div className="px-3 pb-4">
            <GoogleDriveFolderGrid contentFolderUrl={post.contentFolderUrl} height={320} />
          </div>
        )}

        {error && <div className="px-3 pb-3 text-[11px] text-red-600">{error}</div>}

        {post.status === "pending" && (
          <div className="border-t border-slate-100">
            {!isRejecting ? (
              <div className="flex h-14">
                <button
                  onClick={() => setIsRejecting(true)}
                  className="flex-1 flex items-center justify-center gap-2 hover:bg-red-500/5 text-red-600 font-bold transition-colors border-r border-slate-100"
                  disabled={loading !== null}
                >
                  <X className="w-5 h-5" /> Reprovar
                </button>
                <button
                  onClick={handleApprove}
                  className="flex-1 flex items-center justify-center gap-2 hover:bg-emerald-500/5 text-emerald-600 font-bold transition-colors"
                  disabled={loading !== null}
                >
                  <Check className="w-5 h-5" /> {loading === "approve" ? "Aprovando..." : "Aprovar"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleReject} className="p-3 space-y-2 bg-slate-50">
                <div className="space-y-1">
                  <p className="text-[11px] font-medium text-slate-700">Motivo da recusa</p>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] outline-none focus:ring-1 focus:ring-primary resize-y min-h-[60px]"
                    placeholder="Explique por que este conteúdo não foi aprovado."
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-medium text-slate-700">
                    Ajustes desejados <span className="text-slate-400">(opcional)</span>
                  </p>
                  <textarea
                    value={adjustments}
                    onChange={(e) => setAdjustments(e.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] outline-none focus:ring-1 focus:ring-primary resize-y min-h-[60px]"
                    placeholder="Descreva como você gostaria que o post fosse ajustado."
                  />
                </div>
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
                    disabled={loading !== null}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-md border border-red-600 bg-red-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-red-700 transition"
                    disabled={loading === "reject"}
                  >
                    {loading === "reject" ? "Enviando..." : "Enviar recusa"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </Card>
    </motion.div>
  );
}

type PublicApprovalResponse = {
  ok: boolean;
  client?: { id: string; name: string };
  posts?: SocialPostInterface[];
  error?: string;
};

export default function PublicApprovalPage() {
  const { token } = useParams() as { token: string };

  const { data, mutate } = useSWR<PublicApprovalResponse>(
    `/api/public/approve/${token}`,
    fetcher
  );

  const client = data?.client;
  const posts = data?.posts;
  const pendingCount = posts?.filter((p) => p.status === "pending").length ?? 0;
  const clientName = client?.name || "Cliente";

  async function approve(postId: string) {
    const res = await fetch(`/api/public/approve/${token}/post/${postId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    });

    if (!res.ok) throw new Error("Approve failed");
    await mutate();
  }

  async function reject(postId: string, payload: { reason: string; adjustments?: string }) {
    const res = await fetch(`/api/public/approve/${token}/post/${postId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "reject",
        reason: payload.reason,
        adjustments: payload.adjustments,
      }),
    });

    if (!res.ok) throw new Error("Reject failed");
    await mutate();
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border overflow-hidden bg-black flex items-center justify-center">
              <Image src="/logo-circle-orange.jpg" alt="Dominus" width={32} height={32} className="block w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-none">{client?.name || "Aprovação"}</span>
              <span className="text-[10px] text-slate-500 font-medium">Aprovação de Conteúdo</span>
            </div>
          </div>
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
            {pendingCount} pendentes
          </Badge>
        </div>
      </header>

      <main className="max-w-xl mx-auto pt-6 space-y-8 px-4 sm:px-0">
        {!data && <div className="text-sm text-slate-500">Carregando conteúdos...</div>}

        {data && !data.ok && <div className="text-sm text-slate-500">Link inválido ou expirado.</div>}

        {client && posts && posts.length === 0 && (
          <div className="text-sm text-slate-500">No momento, não há conteúdos pendentes de aprovação.</div>
        )}

        <AnimatePresence>
          {posts?.map((post) => (
            <ApprovalCard
              key={post._id}
              post={post}
              clientName={clientName}
              onApproved={approve}
              onRejected={reject}
            />
          ))}
        </AnimatePresence>
      </main>
    </div>
  );
}
