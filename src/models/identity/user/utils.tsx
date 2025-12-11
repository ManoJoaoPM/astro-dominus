"use client";
import { FieldInterface } from "@discovery-solutions/struct/client";
import { UserInterface } from "@/models/identity/user";
import { ColumnDef } from "@tanstack/react-table";
import { TagsView } from "@/components/tags-view";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export * from "@/models/identity/user";

export const ROLES = {
  admin: "Administrador",
  operational: "Time Operacional",
  commercial: "Time Comercial",
  "*": "Indefinido"
}

export const userColumns: ColumnDef<UserInterface>[] = [
  {
    accessorKey: "name",
    header: "Nome",
    cell: ({ row }) => row.original.name,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => row.original.email,
  },
  {
    accessorKey: "role",
    header: "Papel",
    cell: ({ row }) => <TagsView tags={[ROLES[row.original.role] || "-"]} />,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <TagsView tags={[row.original.status === "active" ? "Active" : "Inactive"]} />,
  }
];

export const userDashboardColumns: (openModal: (...args: any) => void) => ColumnDef<UserInterface>[] = (openModal) => [
  {
    accessorKey: "name",
    header: "Nome",
    cell: ({ row }: any) => (
      <button onClick={() => openModal({ modalId: "user", defaultValues: row.original, id: row.original._id })} className="flex flex-col items-start hover:underline">
        <p>{row.original.name}</p>
        <p className="text-xs text-gray-500">{row.original.email}</p>
      </button>
    )
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <TagsView tags={[row.original.status === "active" ? "Ativo" : "Desativado"]} />,
  },
  {
    accessorKey: "createdAt",
    header: "Data de Criação",
    cell: ({ row }) => format(new Date(row.original.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR }),
  },
]

export const userFields: FieldInterface[] = [
  { name: "avatar", label: "Avatar", type: "avatar", required: false, colSpan: 1 },
  { name: "name", label: "Nome", type: "text", required: true, placeholder: "Ex: João Paulo", colSpan: 1 },
  { name: "email", label: "Email", type: "text", required: true, placeholder: "joao@gmail.com", colSpan: 1 },
  { name: "password", label: "Senha", type: "password", placeholder: "********", colSpan: 1 },
  {
    name: "role", label: "Papel", type: "select", required: true, options: [
      { value: "admin", label: "Administrador" },
      { value: "user", label: "Cliente/Usuário" },
    ], defaultValue: "user", colSpan: 1
  },
  {
    name: "status", label: "Status", type: "select", required: true, options: [
      { value: "active", label: "Ativo" },
      { value: "inactive", label: "Desativado" },
    ], defaultValue: "active", colSpan: 1
  },
]