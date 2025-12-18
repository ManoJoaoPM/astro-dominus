"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import Image from "next/image";
import { useMemo } from "react";
import type { ClientInterface } from "@/models/client";
import type { SocialPostInterface } from "@/models/socialmedia/post";
import { GoogleDriveFolderGrid } from "@/components/GoogleDriveFolderGrid";

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

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Cabeçalho público */}
      <header className="w-full border-b bg-white">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-semibold text-slate-900">
              Timeline de conteúdos
            </h1>
            <p className="text-[11px] text-slate-500">
              Visualize os conteúdos planejados e produzidos pela equipe Dominus.
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

        {client && !posts && (
          <p className="text-sm text-slate-500">
            Carregando timeline de conteúdos...
          </p>
        )}

        {client && posts && posts.length === 0 && (
          <p className="text-sm text-slate-500">
            Ainda não há conteúdos cadastrados para este cliente.
          </p>
        )}

        {sortedPosts.length > 0 && (
          <div className="relative mt-4">
            {/* Linha vertical */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-300" />

            <ul className="space-y-8">
              {sortedPosts.map((post) => {
                const date = new Date(post.publishDate);
                const dateLabel = date.toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                });
                const dateCircle = date.toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                });

                return (
                  <li key={post._id} className="relative">
                    <div className="flex gap-4 items-start">
                      {/* Bolão da data */}
                      <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white text-[11px] font-semibold shadow-sm">
                          <span className="text-center leading-tight">
                            {dateCircle}
                            <br />
                            <span className="text-[9px] opacity-90">
                              {date.getFullYear()}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Card do post */}
                      <div className="flex-1 rounded-xl border bg-white p-4 shadow-sm space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-[11px] font-medium text-slate-500">
                              {formatFormat(post.format)}
                            </p>
                            <p className="text-sm font-semibold line-clamp-2 text-slate-900">
                              {post.title}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Publicação: {dateLabel}
                            </p>
                          </div>

                          <span
                            className={
                              "text-[10px] px-2 py-1 rounded-full border font-medium " +
                              statusColor(post.status)
                            }
                          >
                            {formatStatus(post.status)}
                          </span>
                        </div>

                        {post.contentFolderUrl && (
                          <div className="space-y-2">
                            <p className="text-[11px] font-medium text-slate-700">Arquivos do conteúdo</p>
                            <GoogleDriveFolderGrid contentFolderUrl={post.contentFolderUrl} height={320} />
                          </div>
                        )}

                        {/* Legenda resumida */}
                        <div className="rounded-md bg-slate-50 p-2 text-[11px] space-y-1">
                          <p className="font-medium text-slate-700">
                            Legenda
                          </p>
                          <p className="text-slate-600 whitespace-pre-line line-clamp-4">
                            {post.caption}
                          </p>
                        </div>

                        {post.contentFolderUrl && (
                          <div className="pt-2 border-t border-slate-200">
                            <a
                              href={post.contentFolderUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition"
                            >
                              Abrir pasta no Google Drive
                              <span aria-hidden className="text-slate-400">↗</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
