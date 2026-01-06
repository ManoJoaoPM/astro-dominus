"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import type { ScraperJobInterface } from "@/models/commercial/scraper-job";

export * from "@/models/commercial/scraper-job";

function formatStatus(status: ScraperJobInterface["status"]) {
  if (status === "pending") return "Pendente";
  if (status === "running") return "Em execução";
  if (status === "completed") return "Concluída";
  if (status === "failed") return "Falha";
  return status;
}

// 👉 Botão de execução do scraper para um job específico
function RunScraperButton({ jobId }: { jobId: string }) {
  const [loading, setLoading] = useState(false);
  const [label, setLabel] = useState("Executar scraper");

  async function handleClick() {
    if (!jobId || loading) return;

    try {
      setLoading(true);
      setLabel("Executando...");

      const res = await fetch(`/api/commercial/scraper-job/${jobId}/run`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("Erro ao executar scraper:", data);
        setLabel("Erro ao executar");
        setTimeout(() => setLabel("Executar scraper"), 2500);
        return;
      }

      setLabel("Executado!");
      // 👇 opção simples: recarregar a página pra atualizar tabela e cards
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err) {
      console.error(err);
      setLabel("Erro ao executar");
      setTimeout(() => setLabel("Executar scraper"), 2500);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-md border px-2 py-1 text-[11px] font-medium hover:bg-accent disabled:opacity-60"
    >
      {label}
    </button>
  );
}

export const scraperJobColumns: ColumnDef<ScraperJobInterface>[] = [
  {
    accessorKey: "query",
    header: "Busca",
    cell: ({ row }) => row.original.query,
  },
  {
    accessorKey: "city",
    header: "Cidade",
    cell: ({ row }) =>
      row.original.city && row.original.state
        ? `${row.original.city} - ${row.original.state}`
        : row.original.city ?? "—",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => formatStatus(row.original.status),
  },
  {
    accessorKey: "totalLeads",
    header: "Total",
    cell: ({ row }) => row.original.totalLeads ?? 0,
  },
  {
    accessorKey: "withEmail",
    header: "Com e-mail",
    cell: ({ row }) => row.original.withEmail ?? 0,
  },
  {
    accessorKey: "withPhone",
    header: "Com telefone",
    cell: ({ row }) => row.original.withPhone ?? 0,
  },
  {
    accessorKey: "startedAt",
    header: "Início",
    cell: ({ row }) =>
      row.original.startedAt
        ? format(new Date(row.original.startedAt), "dd/MM/yyyy HH:mm", {
            locale: ptBR,
          })
        : "—",
  },
  {
    accessorKey: "finishedAt",
    header: "Fim",
    cell: ({ row }) =>
      row.original.finishedAt
        ? format(new Date(row.original.finishedAt), "dd/MM/yyyy HH:mm", {
            locale: ptBR,
          })
        : "—",
  },
  // 👉 Nova coluna de ações
  {
    id: "job-actions",
    header: "Ações",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original._id && (
          <RunScraperButton jobId={row.original._id as string} />
        )}
        {row.original._id && (
          <a
            href={`/dashboard/leads/scraper?scraperJobId=${row.original._id}`}
            className="rounded-md border px-2 py-1 text-[11px] font-medium hover:bg-accent"
          >
            Ver Leads
          </a>
        )}
      </div>
    ),
  },
];
