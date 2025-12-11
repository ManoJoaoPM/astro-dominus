"use client";

import { useState } from "react";
import useSWR from "swr";
import { SiteHeader } from "@/components/site-header";
import { TableView } from "@discovery-solutions/struct/client";

import {
  scraperJobColumns,
  ScraperJobInterface,
} from "@/models/commercial/scraper-job/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function CommercialScraperPage() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Buscar o último job para o card de resumo
  const { data: lastJobs, mutate: mutateLastJobs } = useSWR<ScraperJobInterface[]>(
    "/api/commercial/scraper-job?limit=1",
    fetcher
  );
  const lastJob = lastJobs?.[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!query.trim()) {
      setError("Informe pelo menos a descrição da busca (ex: imobiliária em São Paulo).");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/commercial/scraper-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          city: city.trim() || undefined,
          state: state.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Erro ao criar job de scraper.");
      }

      setSuccess("Busca criada com sucesso. O processamento poderá ser integrado ao DataForSEO.");
      setQuery("");
      setCity("");
      setState("");

      // Atualiza o card do último job
      mutateLastJobs();
    } catch (err: any) {
      setError(err.message || "Erro inesperado ao criar job.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <SiteHeader
        heading={[
          { link: "/dashboard", label: "Dashboard" },
          { link: "/dashboard/commercial/scraper", label: "Scraper Comercial" },
        ]}
      />

      <div className="px-4 py-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Cabeçalho */}
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Scraper de Imobiliárias</h1>
              <p className="text-sm text-muted-foreground">
                Prospecção automatizada de imobiliárias via Google Maps / DataForSEO.
              </p>
            </div>
          </div>

          {/* GRID: Nova busca + Resumo da última coleta */}
          <div className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            {/* Card: Nova busca */}
            <div className="rounded-xl border bg-card p-4 space-y-4">
              <div>
                <h2 className="text-sm font-semibold">Nova busca</h2>
                <p className="text-xs text-muted-foreground">
                  Defina a região e descrição da busca. Posteriormente, este job poderá acionar
                  a integração com o DataForSEO para coletar os leads automaticamente.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-medium">Descrição da busca</label>
                  <input
                    type="text"
                    className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
                    placeholder='Ex: "imobiliária em São Paulo"'
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-medium">Cidade</label>
                    <input
                      type="text"
                      className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
                      placeholder="Ex: São Paulo"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium">Estado</label>
                    <input
                      type="text"
                      className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
                      placeholder="Ex: SP"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-[11px] text-red-600">{error}</p>
                )}

                {success && (
                  <p className="text-[11px] text-emerald-600">{success}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 inline-flex items-center justify-center rounded-md border bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {loading ? "Criando busca..." : "Criar busca de scraper"}
                </button>
              </form>
            </div>

            {/* Card: Resumo da última coleta */}
            <div className="rounded-xl border bg-card p-4 text-xs space-y-3">
              <div>
                <h2 className="text-sm font-semibold">Resumo da última coleta</h2>
                <p className="text-xs text-muted-foreground">
                  Visão rápida dos últimos resultados de scraping registrados no sistema.
                </p>
              </div>

              {!lastJob && (
                <p className="text-xs text-muted-foreground">
                  Nenhum job de scraper criado ainda.
                </p>
              )}

              {lastJob && (
                <div className="space-y-3 pt-2 border-t">
                  <div className="space-y-1">
                    <p className="text-[11px] font-medium">Busca</p>
                    <p className="text-[11px] text-muted-foreground">
                      {lastJob.query}
                    </p>
                    {(lastJob.city || lastJob.state) && (
                      <p className="text-[11px] text-muted-foreground">
                        Região:{" "}
                        {lastJob.city && lastJob.state
                          ? `${lastJob.city} - ${lastJob.state}`
                          : lastJob.city ?? lastJob.state}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border bg-background p-2 flex flex-col gap-1">
                      <p className="text-[10px] text-muted-foreground">
                        Total coletado
                      </p>
                      <p className="text-lg font-semibold">
                        {lastJob.totalLeads ?? 0}
                      </p>
                    </div>

                    <div className="rounded-lg border bg-background p-2 flex flex-col gap-1">
                      <p className="text-[10px] text-muted-foreground">
                        Com e-mail
                      </p>
                      <p className="text-lg font-semibold">
                        {lastJob.withEmail ?? 0}
                      </p>
                    </div>

                    <div className="rounded-lg border bg-background p-2 flex flex-col gap-1">
                      <p className="text-[10px] text-muted-foreground">
                        Com telefone
                      </p>
                      <p className="text-lg font-semibold">
                        {lastJob.withPhone ?? 0}
                      </p>
                    </div>

                    <div className="rounded-lg border bg-background p-2 flex flex-col gap-1">
                      <p className="text-[10px] text-muted-foreground">
                        Com site
                      </p>
                      <p className="text-lg font-semibold">
                        {lastJob.withWebsite ?? 0}
                      </p>
                    </div>

                    <div className="rounded-lg border bg-background p-2 flex flex-col gap-1">
                      <p className="text-[10px] text-muted-foreground">
                        Com Instagram
                      </p>
                      <p className="text-lg font-semibold">
                        {lastJob.withInstagram ?? 0}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Histórico de buscas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Histórico de buscas</h2>
                <p className="text-xs text-muted-foreground">
                  Todas as execuções de scraping registradas no sistema.
                </p>
              </div>
            </div>

            <TableView
              endpoint="commercial/scraper-job"
              columns={scraperJobColumns}
              hideAdd
            />
          </div>
        </div>
      </div>
    </div>
  );
}
