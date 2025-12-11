// src/models/astro/editorial-line/utils.tsx
"use client";

import { FieldInterface } from "@discovery-solutions/struct/client";
import { ColumnDef } from "@tanstack/react-table";
import { EditorialLineInterface } from "@/models/socialmedia/editorial-line";

export * from "@/models/socialmedia/editorial-line";

export const editorialLineColumns: ColumnDef<EditorialLineInterface>[] = [
  {
    accessorKey: "name",
    header: "Linha Editorial",
    cell: ({ row }) => row.original.name,
  },
  {
    accessorKey: "objective",
    header: "Objetivo",
    cell: ({ row }) => row.original.objective ?? "-",
  },
  {
    accessorKey: "frequency",
    header: "Frequência",
    cell: ({ row }) => row.original.frequency ?? "-",
  },
];

export const editorialLineFields: FieldInterface[] = [
  {
    name: "name",
    label: "Nome da linha editorial",
    type: "text",
    required: true,
    placeholder: "Ex: Prova social, Educação, Captação de imóveis...",
  },
  {
    name: "objective",
    label: "Objetivo",
    type: "textarea",
    placeholder: "Ex: Gerar autoridade, atrair leads qualificados...",
  },
  {
    name: "description",
    label: "Descrição",
    type: "textarea",
    placeholder: "Explique como essa linha será usada na prática...",
  },
  {
    name: "frequency",
    label: "Frequência recomendada",
    type: "text",
    placeholder: "Ex: 2x por semana",
  },
  {
    name: "notes",
    label: "Observações",
    type: "textarea",
    placeholder: "Regras específicas para essa linha...",
  },
];
