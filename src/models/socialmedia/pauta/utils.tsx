// src/models/astro/pauta/utils.tsx
"use client";

import { FieldInterface } from "@discovery-solutions/struct/client";
import { ColumnDef } from "@tanstack/react-table";
import { PautaInterface } from "@/models/socialmedia/pauta";

export * from "@/models/socialmedia/pauta";

export const pautaColumns: ColumnDef<PautaInterface>[] = [
  {
    accessorKey: "title",
    header: "Pauta",
    cell: ({ row }) => row.original.title,
  },
  {
    accessorKey: "cta",
    header: "CTA",
    cell: ({ row }) => row.original.cta ?? "-",
  },
];

export const pautaFields: FieldInterface[] = [
  {
    name: "title",
    label: "Título da pauta",
    type: "text",
    required: true,
    placeholder: "Ex: Post de captação de imóveis na região X",
  },
  {
    name: "copy",
    label: "Copy base",
    type: "textarea",
    placeholder: "Escreva aqui a copy base que o time vai usar...",
  },
  {
    name: "hooks",
    label: "Ganchos",
    type: "tags",
    placeholder: "Liste alguns ganchos para variações...",
  } as any, // dependendo de como você implementou esse tipo de campo
  {
    name: "cta",
    label: "CTA principal",
    type: "text",
    placeholder: "Ex: Fale com a nossa equipe pelo WhatsApp...",
  },
  {
    name: "structure",
    label: "Estrutura",
    type: "textarea",
    placeholder: "Estrutura do carrossel / roteiro do vídeo...",
  },
  {
    name: "notes",
    label: "Observações",
    type: "textarea",
    placeholder: "Regras e detalhes para o time operacional.",
  },
];
