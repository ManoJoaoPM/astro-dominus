"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import Image from "next/image";
import { useMemo } from "react";
import type { ClientInterface } from "@/models/client";
import type { SocialPostInterface } from "@/models/socialmedia/post";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CalendarDays, CheckCircle2, Clock } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatFormat(value: SocialPostInterface["format"]) {
  if (value === "carousel") return "Carrossel";
  if (value === "reels") return "Reels";
  if (value === "static") return "Post estático";
  if (value === "video") return "Vídeo";
  if (value === "ad") return "Anúncio";
  return "Outro";
}

function formatStatus(status: SocialPostInterface["status"]) {
  if (status === "approved") return "Aprovado";
  if (status === "rejected") return "Reprovado";
  if (status === "revision_sent") return "Revisão enviada";
  return "Em aprovação";
}

function statusColor(status: SocialPostInterface["status"]) {
  if (status === "approved") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "rejected") return "bg-red-50 text-red-700 border-red-200";
  if (status === "revision_sent") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

export default function PublicTimelinePage() {
  return <LegacyPublicTimelinePage />;
}

function LegacyPublicTimelinePage() {
  const { token } = useParams() as { token: string };

  // 1) Busca cliente pelo approvalToken
  const { data: clients } = useSWR<ClientInterface[]>(
    token ? `/api/client?approvalToken=${token}` : null,
    fetcher
  );
  const client = clients?.[0];

  // 2) Busca posts desse cliente
  const { data: posts } = useSWR<SocialPostInterface[]>(
    client ? `/api/social-post?clientId=${client._id}&status=approved` : null,
    fetcher
  );

  const sortedPosts = useMemo(() => {
    if (!posts) return [];
    return [...posts].sort(
      (a, b) =>
        new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime()
    );
  }, [posts]);

  const items = useMemo(() => {
    const now = Date.now();
    return sortedPosts.map((post) => {
      const date = new Date(post.publishDate);
      const isFuture = date.getTime() > now;
      const status = isFuture ? "scheduled" : "published";
      const dateLabel = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      const dayLabel = date.toLocaleDateString("pt-BR", { weekday: "short" });
      const timeLabel = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      return { post, status, dateLabel, dayLabel, timeLabel };
    });
  }, [sortedPosts]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center overflow-hidden">
              <Image src="/logo-circle-orange.jpg" alt="Dominus" width={32} height={32} className="block w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">{client?.name ?? "Cliente"}</h1>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <CalendarDays className="w-3 h-3" />
                <span>Cronograma de Publicações</span>
              </div>
            </div>
          </div>
          <Badge className="bg-emerald-600 text-white">Ativo</Badge>
        </div>
      </header>

      <main className="max-w-2xl mx-auto py-10 px-6">
        {!client && <div className="text-sm text-slate-500">Carregando informações do cliente...</div>}
        {client && !posts && <div className="text-sm text-slate-500">Carregando timeline de conteúdos...</div>}
        {client && posts && posts.length === 0 && (
          <div className="text-sm text-slate-500">Ainda não há conteúdos cadastrados para este cliente.</div>
        )}

        {items.length > 0 && (
          <div className="relative">
            <div className="absolute left-[31px] top-0 bottom-0 w-0.5 bg-slate-200" />

            <div className="space-y-12">
              {items.map((item, index) => (
                <TimelineItem key={item.post._id ?? index} item={item as { post: SocialPostInterface; status: "scheduled" | "published"; dateLabel: string; dayLabel: string; timeLabel: string; }} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
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
    const m1 = s.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    const m2 = s.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    const m3 = s.match(/\/d\/([a-zA-Z0-9_-]+)/);
    const id = m1?.[1] || m2?.[1] || m3?.[1] || null;
    if (id) return `https://drive.usercontent.google.com/download?id=${id}&export=view&authuser=0`;
  }
  return s;
}

function toProxySrc(url?: string | null) {
  const normalized = normalizeImageUrl(url);
  if (!normalized) return null;
  return `/api/media/image-proxy?url=${encodeURIComponent(normalized)}`;
}

function TimelineItem({
  item,
}: {
  item: {
    post: SocialPostInterface;
    status: "scheduled" | "published";
    dateLabel: string;
    dayLabel: string;
    timeLabel: string;
  };
}) {
  const statusConfig = {
    scheduled: { label: "Agendado", color: "bg-primary text-white" },
    published: { label: "Publicado", color: "bg-emerald-600 text-white" },
  } as const;

  const config = statusConfig[item.status];
  const preview = item.post.mediaUrls?.[0] || null;
  const imgSrc = toProxySrc(preview);
  const emptyLabel = item.post.status === "approved" ? "Em Produção" : "Em Aprovação";

  return (
    <div className="relative flex gap-8 group">
      <div className="flex flex-col items-center pt-2">
        <div className="w-16 text-center space-y-0.5">
          <span className="block text-lg font-bold leading-none">{item.dateLabel}</span>
          <span className="block text-[10px] text-slate-400 font-bold uppercase">{item.dayLabel}</span>
        </div>
        <div className={cn("w-4 h-4 rounded-full border-4 border-slate-50 mt-4 relative z-10", config.color.split(" ")[0])} />
      </div>

      <motion.div whileHover={{ x: 5 }} className="flex-1">
        <Card className="border-none shadow-sm overflow-hidden bg-white">
          <div className="flex h-32">
            <div className="w-32 bg-slate-100 flex items-center justify-center overflow-hidden">
              {imgSrc ? (
                <img src={imgSrc} className="w-full h-full object-cover" alt="Preview" referrerPolicy="no-referrer" />
              ) : (
                <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{emptyLabel}</div>
              )}
            </div>
            <CardContent className="flex-1 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="secondary" className="text-[10px] py-0">
                    {formatFormat(item.post.format)}
                  </Badge>
                </div>
                <h3 className="font-bold text-slate-800 leading-snug">{item.post.title}</h3>
                {!!item.post.caption && (
                  <p className="mt-1 text-[11px] text-slate-500 whitespace-pre-line line-clamp-2">
                    {item.post.caption}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight", config.color)}>
                  {config.label}
                </div>
                <div className="flex-1 h-px bg-slate-100" />
                <CheckCircle2 className={cn("w-4 h-4", item.status === "published" ? "text-emerald-600" : "text-slate-200")} />
              </div>
            </CardContent>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
