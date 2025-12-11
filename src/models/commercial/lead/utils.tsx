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
    cell: ({ row }) => row.original.name,
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
    placeholder: "Ex: São Paulo",
  },
  {
    name: "state",
    label: "Estado",
    type: "text",
    placeholder: "Ex: SP",
  },
  {
    name: "address",
    label: "Endereço",
    type: "text",
    placeholder: "Rua, número, bairro...",
    colSpan: 2,
  },
  {
    name: "phone",
    label: "Telefone",
    type: "text",
    placeholder: "Ex: (11) 99999-9999",
  },
  {
    name: "email",
    label: "Email",
    type: "text",
    placeholder: "contato@imobiliaria.com",
  },
  {
    name: "website",
    label: "Site",
    type: "text",
    placeholder: "https://imobiliaria.com.br",
  },
  {
    name: "instagram",
    label: "Instagram",
    type: "text",
    placeholder: "https://instagram.com/imobiliaria",
  },
  {
    name: "qualificationStatus",
    label: "Status de qualificação",
    type: "select",
    options: [
      { label: "Pendente", value: "pending" },
      { label: "Qualificado", value: "qualified" },
      { label: "Desqualificado", value: "unqualified" },
    ],
  },
  {
    name: "qualificationNotes",
    label: "Observações de qualificação",
    type: "textarea",
    placeholder: "Fit ideal para Social Media, anúncios, alto padrão...",
    colSpan: 2,
  },
];
