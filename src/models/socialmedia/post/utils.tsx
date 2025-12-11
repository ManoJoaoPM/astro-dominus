"use client";

import { ColumnDef } from "@tanstack/react-table";
import { FieldInterface } from "@discovery-solutions/struct/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SocialPostInterface } from "@/models/socialmedia/post";

export * from "@/models/socialmedia/post";

function formatStatus(status: SocialPostInterface["status"]) {
  if (status === "approved") return "Aprovado";
  if (status === "rejected") return "Reprovado";
  if (status === "revision_sent") return "Revisão enviada";
  return "Aguardando aprovação";
}

function formatFormat(value: SocialPostInterface["format"]) {
  if (value === "carousel") return "Carrossel";
  if (value === "reels") return "Reels";
  if (value === "static") return "Post estático";
  if (value === "video") return "Vídeo";
  if (value === "ad") return "Anúncio";
  return "Outro";
}

// Colunas para listagem interna
export const socialPostColumns: ColumnDef<SocialPostInterface>[] = [
  {
    accessorKey: "title",
    header: "Título",
    cell: ({ row }) => row.original.title,
  },
  {
    accessorKey: "format",
    header: "Formato",
    cell: ({ row }) => formatFormat(row.original.format),
  },
  {
    accessorKey: "publishDate",
    header: "Publicação",
    cell: ({ row }) =>
      format(new Date(row.original.publishDate), "dd/MM/yyyy", {
        locale: ptBR,
      }),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => formatStatus(row.original.status),
  },
];

// ⚠️ Repara: não tem mais clientId aqui
export const socialPostFieldsBase: FieldInterface[] = [
  {
    name: "format",
    label: "Formato",
    type: "select",
    required: true,
    options: [
      { label: "Carrossel", value: "carousel" },
      { label: "Reels", value: "reels" },
      { label: "Post estático", value: "static" },
      { label: "Vídeo", value: "video" },
      { label: "Anúncio", value: "ad" },
      { label: "Outro", value: "other" },
    ],
    colSpan: 1,
  },
  {
    name: "title",
    label: "Título do conteúdo",
    type: "text",
    required: true,
    placeholder: "Ex: 5 erros que fazem você perder leads",
    colSpan: 2,
  },
  {
    name: "internalNotes",
    label: "Observação interna",
    type: "textarea",
    placeholder: "Instruções específicas para o time de criação...",
    colSpan: 2,
  },
  {
    name: "caption",
    label: "Legenda",
    type: "textarea",
    required: true,
    placeholder: "Legenda final que será publicada...",
    colSpan: 2,
  },
  {
    name: "publishDate",
    label: "Data de publicação",
    type: "date",
    required: true,
    colSpan: 1,
  },
  {
    name: "contentFolderUrl",
    label: "URL da pasta do conteúdo",
    type: "text",
    placeholder: "Ex: link do Google Drive com os arquivos",
    colSpan: 2,
  },
  {
    name: "coverUrl",
    label: "URL da capa / thumbnail",
    type: "text",
    placeholder: "Ex: link da imagem de capa",
    colSpan: 2,
  },
];
