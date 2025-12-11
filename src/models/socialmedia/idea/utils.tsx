// src/models/astro/idea/utils.tsx
"use client";

import { FieldInterface } from "@discovery-solutions/struct/client";
import { ColumnDef } from "@tanstack/react-table";
import { IdeaInterface } from "@/models/socialmedia/idea";

export * from "@/models/socialmedia/idea";

export const ideaColumns: ColumnDef<IdeaInterface>[] = [
  {
    accessorKey: "title",
    header: "Ideia",
    cell: ({ row }) => row.original.title,
  },
  {
    accessorKey: "format",
    header: "Formato",
    cell: ({ row }) => row.original.format ?? "-",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const value = row.original.status;
      if (value === "validated") return "Validada";
      if (value === "archived") return "Arquivada";
      return "Rascunho";
    },
  },
];

export const ideaFields: FieldInterface[] = [
  {
    name: "title",
    type: "text",
    label: "Título da ideia",
    required: true,
    placeholder: "Ex: 5 erros que impedem você de vender seu imóvel",
  },
  {
    name: "description",
    type: "textarea",
    label: "Descrição",
    placeholder: "Explique o contexto da ideia...",
  },
  {
    name: "format",
    type: "select",
    label: "Formato",
    options: [
      { label: "Reels", value: "reels" },
      { label: "Carrossel", value: "carousel" },
      { label: "Vídeo", value: "video" },
      { label: "Anúncio", value: "ad" },
      { label: "Story", value: "story" },
    ],
  },
  {
    name: "notes",
    type: "textarea",
    label: "Observações",
    placeholder: "Algo importante para a equipe lembrar ao usar essa ideia.",
  },
];
