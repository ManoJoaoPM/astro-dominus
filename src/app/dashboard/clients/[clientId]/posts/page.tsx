"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import Image from "next/image";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Copy,
  Clock,
  ExternalLink,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import {
  ModalForm,
  ModalFormProvider,
  TableView,
  useModalForm,
} from "@discovery-solutions/struct/client";

import {
  socialPostColumns,
  socialPostFieldsBase,
  socialPostFormSchema,
} from "@/models/socialmedia/post/utils";
import type { SocialPostInterface } from "@/models/socialmedia/post";
import type { ClientInterface } from "@/models/client";

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
      return `https://drive.usercontent.google.com/download?id=${id}&export=view&authuser=0${
        resourceKey ? `&resourcekey=${encodeURIComponent(resourceKey)}` : ""
      }`;
    }
  }
  return s;
}

function toProxySrc(url?: string | null) {
  const normalized = normalizeImageUrl(url);
  if (!normalized) return null;
  return `/api/media/image-proxy?url=${encodeURIComponent(normalized)}`;
}

function getStatusUI(status: SocialPostInterface["status"]) {
  if (status === "approved") {
    return { label: "Aprovado", Icon: CheckCircle2, className: "text-emerald-700 bg-emerald-500/10 border-emerald-500/20" };
  }
  if (status === "rejected" || status === "revision_sent") {
    return { label: "Ajustar", Icon: AlertCircle, className: "text-destructive bg-destructive/10 border-destructive/20" };
  }
  return { label: "Pendente", Icon: Clock, className: "text-amber-700 bg-amber-500/10 border-amber-500/20" };
}

export default function ClientPostsPage() {
  return (
    <ModalFormProvider>
      <ClientPostsPageInner />
    </ModalFormProvider>
  );
}

function ClientPostsPageInner() {
  const { clientId } = useParams() as { clientId: string };
  const { openModal } = useModalForm();
  const [searchTerm, setSearchTerm] = useState("");
  const [tab, setTab] = useState<"all" | "pending" | "approved">("all");
  const [deleteTarget, setDeleteTarget] = useState<SocialPostInterface | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: client } = useSWR<ClientInterface>(clientId ? `/api/client/${clientId}` : null, fetcher);
  const { data: posts, mutate } = useSWR<SocialPostInterface[]>(`/api/social-post?clientId=${clientId}`, fetcher);

  const filtered = useMemo(() => {
    const list = posts ?? [];
    const byTab =
      tab === "all"
        ? list
        : tab === "pending"
          ? list.filter((p) => p.status === "pending")
          : list.filter((p) => p.status === "approved");

    const q = searchTerm.trim().toLowerCase();
    if (!q) return byTab;
    return byTab.filter((p) => `${p.title ?? ""}\n${p.caption ?? ""}`.toLowerCase().includes(q));
  }, [posts, tab, searchTerm]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
  }, [filtered]);

  function requestDelete(post: SocialPostInterface) {
    setDeleteError(null);
    setDeleteTarget(post);
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget?._id) return;
    try {
      setDeleteLoading(true);
      setDeleteError(null);
      const res = await fetch(`/api/social-post/${deleteTarget._id}`, { method: "DELETE" });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        setDeleteError(msg || "Não foi possível excluir o post.");
        return;
      }
      setDeleteOpen(false);
      setDeleteTarget(null);
      await mutate();
    } finally {
      setDeleteLoading(false);
    }
  }

  function handleDuplicate(post: SocialPostInterface) {
    openModal({
      modalId: "socialPost",
      defaultValues: {
        clientId: post.clientId,
        format: post.format,
        title: `${post.title} (Cópia)`,
        internalNotes: post.internalNotes ?? "",
        caption: post.caption ?? "",
        publishDate: post.publishDate,
        contentFolderUrl: post.contentFolderUrl ?? "",
        mediaUrls: post.mediaUrls ?? [],
        status: "pending",
        rejectionReason: "",
        revisionRequest: "",
      } as any,
    });
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href={`/dashboard/clients/${clientId}`} className="hover:text-foreground">
              <span className="cursor-pointer">{client?.name ?? "Cliente"}</span>
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-medium">Posts Social Media</span>
          </div>
          <div className="flex items-center justify-between mt-2 gap-4">
            <h1 className="text-3xl font-bold">Gerenciamento de Posts</h1>
            <Button
              className="gap-2"
              onClick={() =>
                openModal({
                  modalId: "socialPost",
                  defaultValues: { clientId } as any,
                })
              }
            >
              <Plus className="w-4 h-4" /> Novo Post
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl shadow-sm border border-border">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título ou legenda..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full md:w-auto">
              <TabsList>
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="pending">Pendentes</TabsTrigger>
                <TabsTrigger value="approved">Aprovados</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {!posts && <div className="text-sm text-muted-foreground">Carregando posts...</div>}
        {posts && posts.length === 0 && (
          <div className="text-sm text-muted-foreground">Nenhum post cadastrado ainda para este cliente.</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sorted.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onEdit={() =>
                openModal({
                  modalId: "socialPost",
                  id: post._id,
                  defaultValues: post as any,
                })
              }
              onDuplicate={() => handleDuplicate(post)}
              onDelete={() => requestDelete(post)}
            />
          ))}
        </div>
      </main>

      <ModalForm
        schema={socialPostFormSchema}
        fields={[
          { name: "clientId", label: "", type: "hidden", defaultValue: clientId },
          ...socialPostFieldsBase,
        ]}
        endpoint="social-post"
        modalId="socialPost"
        title="Criar/Editar Post"
        buttonLabel="Salvar"
        cols={2}
        onSuccess={() => mutate()}
      />

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) {
            setDeleteTarget(null);
            setDeleteError(null);
            setDeleteLoading(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir post</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este post? Essa ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          {deleteTarget && (
            <div className="text-sm">
              <span className="font-medium">Post:</span> {deleteTarget.title}
            </div>
          )}

          {deleteError && <div className="text-sm text-destructive">{deleteError}</div>}

          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => setDeleteOpen(false)}
              disabled={deleteLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              type="button"
              onClick={confirmDelete}
              disabled={deleteLoading}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PostCard({
  post,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  post: SocialPostInterface;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const ui = getStatusUI(post.status);
  const previewUrl = post.mediaUrls?.[0] || null;
  const imageSrc = toProxySrc(previewUrl);
  const emptyLabel =
    post.status === "approved" ? "Em Produção" : post.status === "pending" ? "Em Aprovação" : "Ajustar";

  useEffect(() => {
    if (!imageSrc) return;
    const img = new window.Image();
    img.referrerPolicy = "no-referrer";
    img.src = imageSrc;
  }, [imageSrc]);

  return (
    <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow group">
      <div className="relative aspect-square overflow-hidden bg-muted">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            referrerPolicy="no-referrer"
            onClick={() => {
              if (!post.contentFolderUrl) return;
              window.open(post.contentFolderUrl, "_blank", "noopener,noreferrer");
            }}
            style={{ cursor: post.contentFolderUrl ? "pointer" : "default" }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">{emptyLabel}</span>
          </div>
        )}

        <div className="absolute top-2 left-2">
          <Badge className="bg-background/80 text-foreground border border-border">{formatFormat(post.format)}</Badge>
        </div>

        {post.contentFolderUrl && (
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 rounded-full"
              onClick={() => window.open(post.contentFolderUrl!, "_blank", "noopener,noreferrer")}
              type="button"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        )}

        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full" type="button">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <button
                  type="button"
                  onClick={() => setTimeout(onEdit, 0)}
                  className="w-full"
                >
                  <Pencil className="w-4 h-4" />
                  Editar
                </button>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <button
                  type="button"
                  onClick={() => setTimeout(onDuplicate, 0)}
                  className="w-full"
                >
                  <Copy className="w-4 h-4" />
                  Duplicar
                </button>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" asChild>
                <button
                  type="button"
                  onClick={() => setTimeout(onDelete, 0)}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-sm line-clamp-1">{post.title}</h3>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
            <Calendar className="w-3 h-3" />
            <span>Previsão: {new Date(post.publishDate).toLocaleDateString("pt-BR")}</span>
          </div>
        </div>

        {(post.status === "rejected" || post.status === "revision_sent") && (post.revisionRequest || post.rejectionReason) && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-red-700 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Ajustes solicitados
              </div>
              <div className="text-xs text-red-800 whitespace-pre-line">
                {post.revisionRequest || post.rejectionReason}
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider", ui.className)}>
            <ui.Icon className="w-3 h-3" />
            {ui.label}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function LegacyClientSocialPostsPage() {
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
                    {post.mediaUrls?.[0] && (
                      <div className="relative w-full h-32 rounded-md overflow-hidden bg-muted">
                        <Image
                          src={post.mediaUrls?.[0] as string}
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

                  {post.contentFolderUrl && (
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
                          {post.mediaUrls?.[0] && (
                            <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                              <Image
                                src={post.mediaUrls?.[0] as string}
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
