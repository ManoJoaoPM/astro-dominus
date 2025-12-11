"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import Image from "next/image";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SiteHeader } from "@/components/site-header";

import {
  ModalForm,
  ModalFormProvider,
  TableView,
} from "@discovery-solutions/struct/client";

import {
  socialPostColumns,
  socialPostFieldsBase,
  socialPostFormSchema,
} from "@/models/socialmedia/post/utils";
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

function formatStatus(status: SocialPostInterface["status"]) {
  if (status === "approved") return "Aprovado";
  if (status === "rejected") return "Reprovado";
  if (status === "revision_sent") return "Revisão enviada";
  return "Pendente";
}

function statusColor(status: SocialPostInterface["status"]) {
  if (status === "approved") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "rejected") return "bg-red-50 text-red-700 border-red-200";
  if (status === "revision_sent") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

type TabType = "table" | "cards" | "timeline";

export default function ClientSocialPostsPage() {
  const { clientId } = useParams() as { clientId: string };

  const [tab, setTab] = useState<TabType>("table");
  const [statusFilter, setStatusFilter] = useState<
    SocialPostInterface["status"] | "all"
  >("all");

  // Posts do cliente (usado por Cards e Timeline)
  const { data: posts } = useSWR<SocialPostInterface[]>(
    `/api/social-post?clientId=${clientId}`,
    fetcher
  );

  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    if (statusFilter === "all") return posts;
    return posts.filter((p) => p.status === statusFilter);
  }, [posts, statusFilter]);

  const sortedPosts = useMemo(() => {
    if (!posts) return [];
    return [...posts].sort(
      (a, b) =>
        new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime()
    );
  }, [posts]);

  const groupedTimeline = useMemo(() => {
    const map = new Map<string, SocialPostInterface[]>();
    for (const post of sortedPosts) {
      const key = new Date(post.publishDate).toLocaleDateString("pt-BR");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(post);
    }
    return Array.from(map.entries());
  }, [sortedPosts]);

  return (
    <Tabs onValueChange={(v) => setTab(v as TabType)} value={tab} className="w-full">
      <SiteHeader
        heading={[
          { link: "/dashboard/clients", label: "Clientes" },
          { link: `/dashboard/clients/${clientId}`, label: "Painel do cliente" },
          { link: "#", label: "Posts de Social Media" },
        ]}
      >
        <TabsList className="grid grid-cols-3 w-fit mx-4 h-8">
          <TabsTrigger value="table" className="px-6 h-6 text-xs">
            Tabela
          </TabsTrigger>
          <TabsTrigger value="cards" className="px-6 h-6 text-xs">
            Cards
          </TabsTrigger>
          <TabsTrigger value="timeline" className="px-6 h-6 text-xs">
            Timeline
          </TabsTrigger>
        </TabsList>
      </SiteHeader>

      <ModalFormProvider>
        {/* 🔹 TABELA */}
        <TabsContent value="table" key="table" className="px-4 py-4">
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold">Posts do cliente</h1>
                <p className="text-sm text-muted-foreground">
                  Criação, edição e organização dos posts deste cliente.
                </p>
              </div>
            </div>

            <TableView
              asChild
              columns={socialPostColumns}
              endpoint="social-post"
              modalId="socialPost"
              queryParams={{ clientId }}
            />
          </div>

          <ModalForm
            schema={socialPostFormSchema}
            fields={[
              {
                name: "clientId",
                label: "",
                type: "hidden",
                defaultValue: clientId,
              },
              ...socialPostFieldsBase,
            ]}
            endpoint="social-post"
            modalId="socialPost"
            title="Criar/Editar Post"
            buttonLabel="Salvar"
            cols={2}
          />
        </TabsContent>

        {/* 🔹 CARDS */}
        <TabsContent value="cards" key="cards" className="px-4 py-4">
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold">Posts em cards</h1>
                <p className="text-sm text-muted-foreground">
                  Visualização em cards com status, descrição interna e motivos de recusa.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Filtrar por status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="rounded-md border px-2 py-1 bg-background"
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendente</option>
                  <option value="approved">Aprovado</option>
                  <option value="rejected">Reprovado</option>
                  <option value="revision_sent">Revisão enviada</option>
                </select>
              </div>
            </div>

            {!posts && (
              <p className="text-sm text-muted-foreground">
                Carregando posts...
              </p>
            )}

            {posts && posts.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum post cadastrado ainda para este cliente.
              </p>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPosts.map((post) => (
                <article
                  key={post._id}
                  className="rounded-xl border bg-card p-4 flex flex-col gap-3"
                >
                  <div className="space-y-2">
                    {post.coverUrl && (
                      <div className="relative w-full h-32 rounded-md overflow-hidden bg-muted">
                        <Image
                          src={post.coverUrl}
                          alt={post.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-medium text-muted-foreground">
                          {formatFormat(post.format)}
                        </p>
                        <p className="text-sm font-semibold line-clamp-2">
                          {post.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Publicação:{" "}
                          {new Date(post.publishDate).toLocaleDateString("pt-BR")}
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
                  </div>

                  {post.internalNotes && (
                    <div className="rounded-md bg-muted/60 p-2 text-[11px] space-y-1">
                      <p className="font-medium text-muted-foreground">
                        Descrição interna
                      </p>
                      <p className="text-muted-foreground whitespace-pre-line">
                        {post.internalNotes}
                      </p>
                    </div>
                  )}

                  <div className="rounded-md bg-muted/40 p-2 text-[11px] space-y-1">
                    <p className="font-medium text-muted-foreground">
                      Legenda
                    </p>
                    <p className="text-muted-foreground whitespace-pre-line line-clamp-5">
                      {post.caption}
                    </p>
                  </div>

                  {(post.contentFolderUrl || post.coverUrl) && (
                    <div className="flex flex-wrap gap-2 text-[11px] pt-1 border-t border-dashed border-muted">
                      {post.contentFolderUrl && (
                        <a
                          href={post.contentFolderUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="underline text-primary"
                        >
                          Pasta do conteúdo
                        </a>
                      )}
                      {post.coverUrl && (
                        <a
                          href={post.coverUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="underline text-primary"
                        >
                          Ver capa
                        </a>
                      )}
                    </div>
                  )}

                  {(post.status === "rejected" ||
                    post.status === "revision_sent") && (
                    <div className="rounded-md bg-red-50 border border-red-100 p-2 text-[11px] space-y-1 mt-1">
                      <p className="font-semibold text-red-700">
                        Motivo da recusa / sugestão de melhoria
                      </p>

                      {post.rejectionReason && (
                        <div>
                          <p className="font-medium text-red-700">Motivo:</p>
                          <p className="text-red-700 whitespace-pre-line">
                            {post.rejectionReason}
                          </p>
                        </div>
                      )}

                      {post.revisionRequest && (
                        <div className="mt-1">
                          <p className="font-medium text-red-700">
                            Ajustes desejados:
                          </p>
                          <p className="text-red-700 whitespace-pre-line">
                            {post.revisionRequest}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* 🔹 TIMELINE */}
        <TabsContent value="timeline2" key="timeline2" className="px-4 py-4">
          <div className="max-w-6xl mx-auto space-y-4">
            <header>
              <h1 className="text-2xl font-semibold">Timeline de conteúdos</h1>
              <p className="text-sm text-muted-foreground">
                Todos os posts deste cliente organizados por data de publicação.
              </p>
            </header>

            {!posts && (
              <p className="text-sm text-muted-foreground">
                Carregando posts...
              </p>
            )}

            {posts && posts.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum post cadastrado ainda para este cliente.
              </p>
            )}

            <div className="space-y-6">
              {groupedTimeline.map(([date, items]) => (
                <section key={date} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs font-semibold text-muted-foreground">
                      {date}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((post) => (
                      <article
                        key={post._id}
                        className="rounded-xl border bg-card p-3 flex flex-col gap-2"
                      >
                        <div className="flex gap-2">
                          {post.coverUrl && (
                            <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                              <Image
                                src={post.coverUrl}
                                alt={post.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}

                          <div className="flex-1 space-y-1">
                            <p className="text-[11px] font-medium text-muted-foreground">
                              {formatFormat(post.format)}
                            </p>
                            <p className="text-sm font-semibold line-clamp-2">
                              {post.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              Status: {formatStatus(post.status)}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-md bg-muted/60 p-2 text-[11px] line-clamp-3">
                          {post.caption}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </TabsContent>
        {/* 🔹 TIMELINE (estilo mais dinâmico) */}
        <TabsContent value="timeline" key="timeline" className="px-4 py-4">
        <div className="max-w-6xl mx-auto space-y-4">
            <header>
            <h1 className="text-2xl font-semibold">Timeline de conteúdos</h1>
            <p className="text-sm text-muted-foreground">
                Todos os posts deste cliente organizados por data de publicação.
            </p>
            </header>

            {!posts && (
            <p className="text-sm text-muted-foreground">
                Carregando posts...
            </p>
            )}

            {posts && posts.length === 0 && (
            <p className="text-sm text-muted-foreground">
                Nenhum post cadastrado ainda para este cliente.
            </p>
            )}

            {sortedPosts.length > 0 && (
            <div className="relative mt-4">
                {/* Linha vertical da timeline */}
                <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

                <ul className="space-y-8">
                {sortedPosts.map((post) => {
                    const date = new Date(post.publishDate);
                    const dateLabel = date.toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    });

                    return (
                    <li key={post._id} className="relative">
                        <div className="flex gap-4 items-start">
                        {/* Bolão de data em cima da linha */}
                        <div className="flex flex-col items-center">
                            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white text-[11px] font-semibold shadow-sm">
                            <span className="text-center leading-tight">
                                {date.toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                })}
                                <br />
                                <span className="text-[9px] opacity-90">
                                {date.getFullYear()}
                                </span>
                            </span>
                            </div>
                        </div>

                        {/* Card de conteúdo */}
                        <div className="flex-1 rounded-xl border bg-card p-4 shadow-sm space-y-2">
                            <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                                <p className="text-[11px] font-medium text-muted-foreground">
                                {formatFormat(post.format)}
                                </p>
                                <p className="text-sm font-semibold line-clamp-2">
                                {post.title}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
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

                            {/* Descrição interna */}
                            {post.internalNotes && (
                            <div className="rounded-md bg-muted/60 p-2 text-[11px] space-y-1">
                                <p className="font-medium text-muted-foreground">
                                Descrição interna
                                </p>
                                <p className="text-muted-foreground whitespace-pre-line">
                                {post.internalNotes}
                                </p>
                            </div>
                            )}

                            {/* Legenda resumida */}
                            <div className="rounded-md bg-muted/40 p-2 text-[11px] space-y-1">
                            <p className="font-medium text-muted-foreground">
                                Legenda
                            </p>
                            <p className="text-muted-foreground whitespace-pre-line line-clamp-4">
                                {post.caption}
                            </p>
                            </div>

                            {/* Motivo de recusa / ajustes, se tiver */}
                            {(post.status === "rejected" ||
                            post.status === "revision_sent") && (
                            <div className="rounded-md bg-red-50 border border-red-100 p-2 text-[11px] space-y-1">
                                <p className="font-semibold text-red-700">
                                Feedback do cliente
                                </p>

                                {post.rejectionReason && (
                                <div>
                                    <p className="font-medium text-red-700">Motivo:</p>
                                    <p className="text-red-700 whitespace-pre-line">
                                    {post.rejectionReason}
                                    </p>
                                </div>
                                )}

                                {post.revisionRequest && (
                                <div className="mt-1">
                                    <p className="font-medium text-red-700">
                                    Ajustes desejados:
                                    </p>
                                    <p className="text-red-700 whitespace-pre-line">
                                    {post.revisionRequest}
                                    </p>
                                </div>
                                )}
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
        </div>
        </TabsContent>

      </ModalFormProvider>
    </Tabs>
  );
}
