"use client";

import { useParams } from "next/navigation";
import { TableView, ModalForm } from "@discovery-solutions/struct/client";
import {
  monthlyPlanFormSchema,
  MonthlyPlanInterface,
  getMonthLabel,
} from "@/models/socialmedia/monthly-plan/utils";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

const monthlyPlanColumns: ColumnDef<MonthlyPlanInterface>[] = [
  {
    accessorKey: "month",
    header: "Mês",
    cell: ({ row }) => getMonthLabel(row.original),
  },
  {
    accessorKey: "items",
    header: "Qtd. itens",
    cell: ({ row }) => row.original.items?.length ?? 0,
  },
];

export default function ClientMonthlyPlansPage() {
  const params = useParams();
  const clientId = params?.id as string;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Planejamento mensal</h1>
          <p className="text-sm text-muted-foreground">
            Crie um planejamento por mês para organizar as linhas editoriais no calendário.
          </p>
        </div>

        <ModalForm
          title="Novo planejamento"
          endpoint="monthly-plan"
          schema={monthlyPlanFormSchema}
          fields={[
            { name: "clientId", label: "", type: "hidden", defaultValue: clientId },
            {
              name: "month",
              label: "Mês",
              type: "number",
              placeholder: "1 a 12",
            },
            {
              name: "year",
              label: "Ano",
              type: "number",
              placeholder: "Ex: 2025",
            },
          ]}
          buttonLabel="Criar planejamento"
          cols={2}
        />
      </div>

      <TableView
        endpoint="monthly-plan"
        columns={[
          ...monthlyPlanColumns,
          {
            header: "Ações",
            cell: ({ row }) => (
              <Link
                href={`clients/${clientId}/monthly-plans/${row.original._id}`}
                className="text-xs text-primary hover:underline"
              >
                Abrir
              </Link>
            ),
          } as any,
        ]}
        queryParams={{ clientId }}
      />
    </div>
  );
}
