// src/models/astro/client/utils.tsx
"use client";

import { FieldInterface } from "@discovery-solutions/struct/client";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClientInterface } from "@/models/client";
import Link from "next/link";

export * from "@/models/client";

export const clientColumns: ColumnDef<ClientInterface>[] = [
  {
    accessorKey: "name",
    header: "Imobiliária",
    cell: ({ row }) => (
      <Link
        href={`/dashboard/clients/${row.original._id}`} // 👈 painel do cliente
        className="flex flex-col items-start hover:underline"
      >
        <span>{row.original.name}</span>
        <span className="text-xs text-muted-foreground">
          {row.original.city ?? ""} {row.original.state ? `- ${row.original.state}` : ""}
        </span>
      </Link>
    ),
  },
  {
    accessorKey: "responsible",
    header: "Responsável",
    cell: ({ row }) => row.original.responsible,
  },
  {
    accessorKey: "city",
    header: "Cidade",
    cell: ({ row }) => `${row.original.city ?? ""} - ${row.original.state ?? ""}`,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      if (status === "active") return "Ativo";
      if (status === "paused") return "Pausado";
      return "Encerrado";
    },
  },
];

export const clientDashboardColumns: (
  openModal: (...args: any) => void
) => ColumnDef<ClientInterface>[] = (openModal) => [
  {
    accessorKey: "name",
    header: "Imobiliária",
    cell: ({ row }) => (
      <button
        onClick={() =>
          openModal({
            modalId: "client",
            defaultValues: row.original,
            id: row.original._id,
          })
        }
        className="flex flex-col items-start hover:underline"
      >
        <p>{row.original.name}</p>
        <p className="text-xs text-gray-500">
          {row.original.city} - {row.original.state}
        </p>
      </button>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Data de Criação",
    cell: ({ row }) =>
      format(new Date(row.original.createdAt), "dd/MM/yyyy HH:mm", {
        locale: ptBR,
      }),
  },
];

export const clientFields: FieldInterface[] = [
  {
    name: "name",
    label: "Nome da Imobiliária",
    type: "text",
    required: true,
    placeholder: "Ex: Genti Imobiliária",
    colSpan: 1,
  },
  {
    name: "responsible",
    label: "Responsável",
    type: "text",
    required: true,
    placeholder: "Nome do responsável",
    colSpan: 1,
  },
  {
    name: "email",
    label: "Email",
    type: "text",
    required: true,
    placeholder: "contato@imobiliaria.com",
    colSpan: 1,
  },
  {
    name: "whatsapp",
    label: "WhatsApp",
    type: "text",
    placeholder: "(00) 00000-0000",
    colSpan: 1,
  },
  {
    name: "city",
    label: "Cidade",
    type: "text",
    placeholder: "Ex: Londrina",
    colSpan: 1,
  },
  {
    name: "state",
    label: "Estado",
    type: "text",
    placeholder: "Ex: PR",
    colSpan: 1,
  },
  {
    name: "niche",
    label: "Nicho",
    type: "text",
    placeholder: "Ex: Alto padrão, MCMV, Loteamentos...",
    colSpan: 2,
  },
  {
    name: "targetAudience",
    label: "Público-alvo",
    type: "textarea",
    placeholder: "Descreva o público ideal da imobiliária...",
    colSpan: 2,
  },
  {
    name: "toneOfVoice",
    label: "Tom de voz",
    type: "textarea",
    placeholder: "Ex: direto, técnico, humanizado...",
    colSpan: 2,
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: [
      { label: "Ativo", value: "active" },
      { label: "Pausado", value: "paused" },
      { label: "Encerrado", value: "closed" },
    ],
    colSpan: 1,
  },
];
