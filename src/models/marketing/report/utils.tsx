import { FieldInterface } from "@discovery-solutions/struct/client";
import { ColumnDef } from "@tanstack/react-table";
import { ReportInterface } from "./index";
import { Edit, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const reportColumns: ColumnDef<ReportInterface>[] = [
  { header: "Nome", accessorKey: "name" },
  { 
    header: "Link Público", 
    cell: ({ row }) => {
      if (!row.original.isPublic) return <span className="text-muted-foreground">Privado</span>;
      const url = `/r/${row.original.slug}`;
      return (
        <a href={url} target="_blank" className="text-blue-500 hover:underline flex items-center gap-1">
          {row.original.slug} <ExternalLink size={14} />
        </a>
      );
    } 
  },
  { 
    header: "Período", 
    accessorKey: "dateRange.period",
    cell: ({ row }) => {
      const map: Record<string, string> = {
        today: "Hoje",
        last_7d: "Últimos 7 dias",
        last_30d: "Últimos 30 dias",
        this_month: "Mês Atual",
        last_month: "Mês Passado",
        custom: "Personalizado"
      };
      return map[row.original.dateRange?.period || "custom"] || row.original.dateRange?.period;
    }
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/dashboard/marketing/reports/${row.original._id}/edit`}>
          <Edit className="w-4 h-4 mr-2" />
          Editar
        </Link>
      </Button>
    )
  }
];

export const reportFields: FieldInterface[] = [
  { 
    name: "clientId", 
    label: "Cliente", 
    type: "model-select", 
    model: "client", 
    required: true,
  },
  { name: "name", label: "Nome do Relatório", type: "text", required: true },
  { name: "isPublic", label: "Público?", type: "checkbox" },
  { 
    name: "dateRange.period", 
    label: "Período Padrão", 
    type: "select", 
    defaultValue: "last_30d",
    options: [
      { label: "Hoje", value: "today" },
      { label: "Últimos 7 dias", value: "last_7d" },
      { label: "Últimos 30 dias", value: "last_30d" },
      { label: "Mês Atual", value: "this_month" },
      { label: "Mês Passado", value: "last_month" },
    ]
  },
];
