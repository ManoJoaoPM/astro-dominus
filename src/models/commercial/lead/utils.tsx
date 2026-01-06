"use client";

import { ColumnDef } from "@tanstack/react-table";
import { FieldInterface } from "@discovery-solutions/struct/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import type { CommercialLeadInterface } from "@/models/commercial/lead";

export * from "@/models/commercial/lead";

// Colunas para a listagem geral (3.3)
export const commercialLeadColumns: ColumnDef<CommercialLeadInterface>[] = [
  {
    accessorKey: "name",
    header: "Imobiliária",
    cell: ({ row }) => (
      <a
        href={`/dashboard/leads/${row.original._id}`}
        className="font-medium hover:underline"
      >
        {row.original.name}
      </a>
    ),
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
    accessorKey: "phone",
    header: "Telefone",
    cell: ({ row }) => row.original.phone ?? "—",
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => row.original.email ?? "—",
  },
  {
    accessorKey: "website",
    header: "Site",
    cell: ({ row }) =>
      row.original.website ? (
        <a
          href={row.original.website}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-primary underline"
        >
          Abrir
        </a>
      ) : (
        "—"
      ),
  },
  {
    accessorKey: "instagram",
    header: "Instagram",
    cell: ({ row }) =>
      row.original.instagram ? (
        <a
          href={row.original.instagram}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-primary underline"
        >
          Perfil
        </a>
      ) : (
        "—"
      ),
  },
  {
    accessorKey: "qualificationStatus",
    header: "Status",
    cell: ({ row }) => {
      const value = row.original.qualificationStatus;
      if (value === "qualified") return "Qualificado";
      if (value === "unqualified") return "Desqualificado";
      return "Pendente";
    },
  },
  {
    accessorKey: "createdAt",
    header: "Entrada",
    cell: ({ row }) =>
      row.original.createdAt
        ? format(new Date(row.original.createdAt), "dd/MM/yyyy", {
            locale: ptBR,
          })
        : "—",
  },
];

// Campos para criação/edição manual (ModalForm, se você quiser)
export const commercialLeadFields: FieldInterface[] = [
  {
    name: "name",
    label: "Nome da imobiliária",
    type: "text",
    required: true,
    placeholder: "Ex: Imobiliária Dominus",
  },
  {
    name: "city",
    label: "Cidade",
    type: "text",
    required: false,
    placeholder: "Ex: São Paulo",
  },
  {
    name: "state",
    label: "Estado",
    type: "text",
    required: false,
    placeholder: "Ex: SP",
  },
  {
    name: "address",
    label: "Endereço",
    type: "text",
    required: false,
    placeholder: "Rua, número, bairro...",
    colSpan: 2,
  },
  {
    name: "phone",
    label: "Telefone",
    type: "text",
    required: false,
    placeholder: "Ex: (11) 99999-9999",
  },
  {
    name: "email",
    label: "Email",
    type: "text",
    required: false,
    placeholder: "contato@imobiliaria.com",
  },
  {
    name: "website",
    label: "Site",
    type: "text",
    required: false,
    placeholder: "https://imobiliaria.com.br",
  },
  {
    name: "instagram",
    label: "Instagram",
    type: "text",
    required: false,
    placeholder: "https://instagram.com/imobiliaria",
  },
  {
    name: "qualificationStatus",
    label: "Status de qualificação",
    type: "select",
    required: true,
    options: [
      { label: "Pendente", value: "pending" },
      { label: "Qualificado", value: "qualified" },
      { label: "Desqualificado", value: "unqualified" },
    ],
    defaultValue: "pending",
  },
  {
    name: "qualificationNotes",
    label: "Observações de qualificação",
    type: "textarea",
    required: false,
    placeholder: "Fit ideal para Social Media, anúncios, alto padrão...",
    colSpan: 2,
  },
];
