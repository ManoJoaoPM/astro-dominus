"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { reportSchema } from "@/models/marketing/report/index";
import { reportColumns, reportFields } from "@/models/marketing/report/utils";
import { useRouter } from "next/navigation";
import { TableView, ModalForm, ModalFormProvider, useModalForm } from "@discovery-solutions/struct/client";

function ReportListContent() {
  const { openModal } = useModalForm();
  const router = useRouter();

  return (
    <div className="space-y-4 p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <Button onClick={() => openModal({ modalId: "create-report" })}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Relatório
        </Button>
      </div>

      <TableView
        endpoint="marketing/reports"
        columns={reportColumns}
        hideAdd
      />

      <ModalForm
        modalId="create-report"
        title="Criar Relatório"
        endpoint="marketing/reports"
        schema={reportSchema}
        fields={reportFields}
        buttonLabel="Criar Relatório"
        onSuccess={(res) => router.push(`/dashboard/marketing/reports/${res._id}/edit`)}
      />
    </div>
  );
}

export default function ReportsPage() {
  return (
    <ModalFormProvider>
      <ReportListContent />
    </ModalFormProvider>
  );
}
