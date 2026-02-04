"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SiteHeader } from "@/components/site-header";

import {
  ModalForm,
  ModalFormProvider,
  useModalForm,
} from "@discovery-solutions/struct/client";

import {
  clientFormSchema,
  clientFields,
} from "@/models/client/utils";
import type { ClientInterface } from "@/models/client";
import type { SocialPostInterface } from "@/models/socialmedia/post";
import MarketingDashboard from "@/components/dashboard/marketing/marketing-dashboard";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function ClientPageInner({ clientId }: { clientId: string }) {
  const [tab, setTab] = useState("overview");
  const { openModal } = useModalForm();

  const {
    data: client,
    isLoading: loadingClient,
  } = useSWR<ClientInterface>(`/api/client/${clientId}`, fetcher);

  const {
    data: posts,
    isLoading: loadingPosts,
  } = useSWR<SocialPostInterface[]>(
    `/api/social-post?clientId=${clientId}`,
    fetcher
  );

  const title = loadingClient ? "Carregando..." : client?.name ?? "Cliente";
  const approvalToken = client?.approvalToken;

  // 👉 Contadores de posts por status
  const {
    totalPosts,
    pendingPosts,
    approvedPosts,
    rejectedPosts,
    revisionPosts,
  } = useMemo(() => {
    if (!posts || posts.length === 0) {
      return {
        totalPosts: 0,
        pendingPosts: 0,
        approvedPosts: 0,
        rejectedPosts: 0,
        revisionPosts: 0,
      };
    }

    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let revision = 0;

    for (const post of posts) {
      if (post.status === "approved") approved++;
      else if (post.status === "pending") pending++;
      else if (post.status === "rejected") rejected++;
      else if (post.status === "revision_sent") revision++;
    }

    return {
      totalPosts: posts.length,
      pendingPosts: pending,
      approvedPosts: approved,
      rejectedPosts: rejected,
      revisionPosts: revision,
    };
  }, [posts]);

  return (
    <Tabs onValueChange={setTab} value={tab} className="w-full">
      <SiteHeader
        heading={[
          { link: "/dashboard/clients", label: "Clientes" },
          { link: "#", label: title },
        ]}
      >
        <TabsList className="grid grid-cols-1 w-fit mx-4 h-8">
          <TabsTrigger value="overview" className="px-6 h-6 text-xs">
            Visão geral
          </TabsTrigger>
          <TabsTrigger value="marketing" className="px-6 h-6 text-xs">
            Mídia Paga
          </TabsTrigger>
        </TabsList>
      </SiteHeader>

      <TabsContent value="overview" key="overview">
        <div className="px-4 py-4">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Cabeçalho */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold">{title}</h1>
                <p className="text-sm text-muted-foreground">
                  Visão geral operacional do cliente dentro do Astro Dominus.
                </p>
              </div>

              <button
                onClick={() => openModal({ 
                  modalId: "client-edit", // 👈 TEM que bater com o modalId do ModalForm
                  id: clientId,           // para o ModalForm saber que é edição
                  defaultValues: client,  // opcional: já preenche o form com os dados carregados
                 })}
                className="rounded-md border px-3 py-2 text-xs md:text-sm font-medium hover:bg-accent"
                disabled={loadingClient || !client}
              >
                Editar dados do cliente
              </button>
            </div>

            {/* PRIMEIRA LINHA – Dados + Resumo operacional */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Card de informações do cliente */}
              <div className="lg:col-span-2 rounded-xl border bg-card p-5 space-y-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold">
                      {client?.name ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {client?.city && client?.state
                        ? `${client.city} - ${client.state}`
                        : client?.city ?? "Cidade não informada"}
                    </p>
                    {client?.niche && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Nicho: {client.niche}
                      </p>
                    )}
                  </div>

                  <span className="self-start text-xs rounded-full border px-2 py-1 text-muted-foreground">
                    {client?.status === "active"
                      ? "Ativo"
                      : client?.status === "paused"
                      ? "Pausado"
                      : client?.status === "closed"
                      ? "Encerrado"
                      : "Sem status"}
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1 text-xs">
                    <p className="font-medium">Responsável</p>
                    <p className="text-muted-foreground">
                      {client?.responsible ?? "Não informado"}
                    </p>
                  </div>

                  <div className="space-y-1 text-xs">
                    <p className="font-medium">E-mail</p>
                    <p className="text-muted-foreground">
                      {client?.email ?? "Não informado"}
                    </p>
                  </div>

                  <div className="space-y-1 text-xs">
                    <p className="font-medium">WhatsApp</p>
                    <p className="text-muted-foreground">
                      {client?.whatsapp ?? "Não informado"}
                    </p>
                  </div>

                  <div className="space-y-1 text-xs">
                    <p className="font-medium">Observações internas</p>
                    <p className="text-muted-foreground">
                      {/* Campo futuro: notes */}
                      —
                    </p>
                  </div>
                </div>
              </div>

              {/* Card de resumo operacional – com contadores */}
              <div className="rounded-xl border bg-card p-5 text-xs space-y-3">
                <p className="text-sm font-semibold">Resumo operacional</p>
                <p className="text-muted-foreground">
                  Visão rápida dos conteúdos de Social Media criados para este cliente.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                  <div className="rounded-lg border bg-background p-2 flex flex-col gap-1">
                    <p className="text-[10px] text-muted-foreground">
                      Posts cadastrados
                    </p>
                    <p className="text-lg font-semibold">
                      {loadingPosts ? "…" : totalPosts}
                    </p>
                  </div>

                  <div className="rounded-lg border bg-background p-2 flex flex-col gap-1">
                    <p className="text-[10px] text-muted-foreground">
                      Aguardando aprovação
                    </p>
                    <p className="text-lg font-semibold">
                      {loadingPosts ? "…" : pendingPosts}
                    </p>
                  </div>

                  <div className="rounded-lg border bg-background p-2 flex flex-col gap-1">
                    <p className="text-[10px] text-muted-foreground">
                      Aprovados
                    </p>
                    <p className="text-lg font-semibold text-emerald-600">
                      {loadingPosts ? "…" : approvedPosts}
                    </p>
                  </div>

                  <div className="rounded-lg border bg-background p-2 flex flex-col gap-1">
                    <p className="text-[10px] text-muted-foreground">
                      Reprovados / revisão
                    </p>
                    <p className="text-lg font-semibold text-red-600">
                      {loadingPosts ? "…" : rejectedPosts + revisionPosts}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* SEGUNDA LINHA – Atalhos operacionais */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Painel operacional</h2>
                  <p className="text-xs text-muted-foreground">
                    Acesse rapidamente os módulos de Social Media do Astro Dominus para este cliente.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <a
                  href={`/dashboard/clients/${clientId}/posts`}
                  className="group flex flex-col gap-2 rounded-xl border bg-card p-4 text-left hover:bg-accent/40 transition"
                >
                  <span className="text-sm font-semibold">Posts</span>
                  <p className="text-xs text-muted-foreground">
                    Gerencie os posts deste cliente: criação, legenda, datas e status.
                  </p>
                  <span className="mt-auto text-xs font-medium text-primary group-hover:underline">
                    Acessar posts
                  </span>
                </a>

                <a
                  href={`/aprovacao/${approvalToken}`}
                  className="group flex flex-col gap-2 rounded-xl border bg-card p-4 text-left hover:bg-accent/40 transition"
                >
                  <span className="text-sm font-semibold">Link de aprovação</span>
                  <p className="text-xs text-muted-foreground">
                    Página pública onde o cliente aprova ou recusa os conteúdos.
                  </p>
                  <span className="mt-auto text-xs font-medium text-primary group-hover:underline">
                    Ver aprovação
                  </span>
                </a>

                <a
                  href={`/timeline/${approvalToken}`}
                  className="group flex flex-col gap-2 rounded-xl border bg-card p-4 text-left hover:bg-accent/40 transition"
                >
                  <span className="text-sm font-semibold">Link de Timeline</span>
                  <p className="text-xs text-muted-foreground">
                    Página pública onde o cliente vê todas as publicações aprovadas por eles.
                  </p>
                  <span className="mt-auto text-xs font-medium text-primary group-hover:underline">
                    Ver timeline
                  </span>
                </a>

                <a
                  href={`/dashboard/clients/${clientId}/posts?tab=cards`}
                  className="group flex flex-col gap-2 rounded-xl border bg-card p-4 text-left hover:bg-accent/40 transition"
                >
                  <span className="text-sm font-semibold">Cards</span>
                  <p className="text-xs text-muted-foreground">
                    Visualize os posts com descrição interna, status e feedbacks do cliente.
                  </p>
                  <span className="mt-auto text-xs font-medium text-primary group-hover:underline">
                    Ver cards
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="marketing" key="marketing">
        <div className="px-4 py-4">
          <div className="max-w-6xl mx-auto">
             <MarketingDashboard clientId={clientId} />
          </div>
        </div>
      </TabsContent>

      {/* Modal de edição do cliente */}
      <ModalForm
        schema={clientFormSchema}
        fields={clientFields}
        endpoint="client"
        modalId="client-edit"
        title="Editar cliente"
        buttonLabel="Salvar alterações"
        cols={2}
      />
    </Tabs>
  );
}

export default function ClientPageWrapper() {
  const { clientId } = useParams() as { clientId: string };

  return (
    <ModalFormProvider>
      <ClientPageInner clientId={clientId} />
    </ModalFormProvider>
  );
}
