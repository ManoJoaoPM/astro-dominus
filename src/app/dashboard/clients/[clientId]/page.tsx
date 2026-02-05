"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";

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
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  Building2,
  ChevronRight,
  Edit3,
  FileText,
  LayoutGrid,
  Mail,
  MapPin,
  Phone,
  ThumbsDown,
  ThumbsUp,
  User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { IconBrandWhatsapp } from "@tabler/icons-react";

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

  const statusBadge = (status?: string) => {
    if (status === "active") return { label: "Ativo", className: "bg-emerald-600 text-white" };
    if (status === "paused") return { label: "Pausado", className: "bg-amber-600 text-white" };
    if (status === "closed") return { label: "Encerrado", className: "bg-red-600 text-white" };
    return { label: "Sem status", className: "bg-muted text-muted-foreground" };
  };

  const badge = statusBadge(client?.status as any);

  return (
    <Tabs onValueChange={setTab} value={tab} className="w-full">
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="px-6 py-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Link href="/dashboard">Dashboard</Link>
                <ChevronRight className="w-3 h-3" />
                <Link href="/dashboard/clients">Clientes</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-foreground font-medium">{title}</span>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{title}</h1>
                <Badge className={badge.className}>{badge.label}</Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                Visão geral operacional do cliente dentro do Astro Dominus.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex bg-muted p-1 rounded-lg">
                <TabsList className="bg-transparent p-0 h-auto">
                  <TabsTrigger value="overview" className="px-4 h-8">
                    Visão geral
                  </TabsTrigger>
                  <TabsTrigger value="marketing" className="px-4 h-8">
                    Mídia Paga
                  </TabsTrigger>
                </TabsList>
              </div>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() =>
                  openModal({
                    modalId: "client-edit",
                    id: clientId,
                    defaultValues: client,
                  })
                }
                disabled={loadingClient || !client}
              >
                <Edit3 className="w-4 h-4" /> Editar dados do cliente
              </Button>
            </div>
          </div>
        </div>
      </header>

      <TabsContent value="overview" key="overview">
        <main className="px-6 py-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6">
              <Card className="overflow-hidden border-none shadow-sm bg-gradient-to-br from-card to-secondary/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-primary" /> Dados do Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <DataRow icon={Building2} label="Nicho" value={client?.niche || "—"} />
                    <DataRow
                      icon={MapPin}
                      label="Local"
                      value={client?.city && client?.state ? `${client.city} - ${client.state}` : client?.city || "—"}
                    />
                    <DataRow icon={UserIcon} label="Responsável" value={client?.responsible || "—"} />
                    <DataRow icon={Mail} label="E-mail" value={client?.email || "—"} />
                    <DataRow icon={Phone} label="WhatsApp" value={client?.whatsapp || "—"} />
                  </div>

                  <div className="pt-4 border-t border-border">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
                      Observações Internas
                    </p>
                    <p className="text-sm text-muted-foreground italic">—</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-8 space-y-6">
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">Resumo operacional</CardTitle>
                      <CardDescription>
                        Visão rápida dos conteúdos de Social Media criados para este cliente.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MiniMetricCard
                      icon={FileText}
                      label="Posts cadastrados"
                      value={loadingPosts ? "…" : String(totalPosts)}
                      variant="primary"
                    />
                    <MiniMetricCard
                      icon={FileText}
                      label="Aguardando aprovação"
                      value={loadingPosts ? "…" : String(pendingPosts)}
                      variant="warning"
                    />
                    <MiniMetricCard
                      icon={ThumbsUp}
                      label="Aprovados"
                      value={loadingPosts ? "…" : String(approvedPosts)}
                      variant="success"
                    />
                    <MiniMetricCard
                      icon={ThumbsDown}
                      label="Reprovados / revisão"
                      value={loadingPosts ? "…" : String(rejectedPosts + revisionPosts)}
                      variant="destructive"
                    />
                  </div>
                </CardContent>
              </Card>

              <section className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold">Painel operacional</h3>
                  <p className="text-sm text-muted-foreground">
                    Acesse rapidamente os módulos de Social Media do Astro Dominus para este cliente.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ActionCard
                    icon={LayoutGrid}
                    title="Posts"
                    description="Gerencie os posts deste cliente: criação, legenda, datas e status."
                    cta="Acessar posts"
                    href={`/dashboard/clients/${clientId}/posts`}
                  />
                  <ActionCard
                    icon={FileText}
                    title="Link de aprovação"
                    description="Página pública onde o cliente aprova ou recusa os conteúdos."
                    cta="Ver aprovação"
                    href={approvalToken ? `/aprovacao/${approvalToken}` : undefined}
                    disabled={!approvalToken}
                  />
                  <ActionCard
                    icon={FileText}
                    title="Link de Timeline"
                    description="Página pública onde o cliente vê todas as publicações aprovadas por eles."
                    cta="Ver timeline"
                    href={approvalToken ? `/timeline/${approvalToken}` : undefined}
                    disabled={!approvalToken}
                  />
                  <ActionCard
                    icon={IconBrandWhatsapp}
                    title="Whatsapp"
                    description="Conecte Whatsapps e observe as conversas com os leads"
                    cta="Ver Whatsapp"
                    href={`/dashboard/clients/${clientId}/whatsapp`}
                  />
                </div>
              </section>
            </div>
          </div>
        </main>
      </TabsContent>

      <TabsContent value="marketing" key="marketing">
        <div className="px-6 py-8">
          <MarketingDashboard clientId={clientId} />
        </div>
      </TabsContent>

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

function DataRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="w-4 h-4" />
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function MiniMetricCard({
  icon: Icon,
  label,
  value,
  variant,
}: {
  icon: any;
  label: string;
  value: string;
  variant: "primary" | "warning" | "success" | "destructive";
}) {
  const map: Record<string, string> = {
    primary: "bg-primary/10 text-primary border-primary/20",
    warning: "bg-amber-500/10 text-amber-700 border-amber-500/20",
    success: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    destructive: "bg-red-500/10 text-red-700 border-red-500/20",
  };

  return (
    <div className={cn("p-4 rounded-xl border text-center space-y-1", map[variant])}>
      <Icon className="w-4 h-4 mx-auto opacity-70" />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-[10px] uppercase font-bold tracking-tight opacity-80 leading-none">{label}</p>
    </div>
  );
}

function ActionCard({
  icon: Icon,
  title,
  description,
  cta,
  href,
  disabled,
}: {
  icon: any;
  title: string;
  description: string;
  cta: string;
  href?: string;
  disabled?: boolean;
}) {
  const content = (
    <CardContent className="p-5 flex flex-col h-full">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-background rounded-lg transition-colors group-hover:bg-primary/10">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <h4 className="font-bold">{title}</h4>
      </div>
      <p className="text-sm text-muted-foreground flex-1 mb-4 leading-relaxed">{description}</p>
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-between transition-all h-9 group-hover:bg-primary group-hover:text-primary-foreground",
          disabled && "opacity-60 pointer-events-none",
        )}
      >
        {cta}
        <ArrowRight className="w-4 h-4" />
      </Button>
    </CardContent>
  );

  if (href && !disabled) {
    return (
      <Link href={href}>
        <Card className="group hover:border-primary/50 transition-all cursor-pointer border-none shadow-sm bg-secondary/30">
          {content}
        </Card>
      </Link>
    );
  }

  return (
    <Card className={cn("group border-none shadow-sm bg-secondary/30", disabled ? "opacity-70" : "hover:border-primary/50 transition-all")}>
      {content}
    </Card>
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
