"use client";

import { useParams } from "next/navigation";
import { TableView, ModalForm } from "@discovery-solutions/struct/client";
import { pautaColumns, pautaFields, pautaFormSchema } from "@/models/socialmedia/pauta/utils";

export default function ClientPautasPage() {
  const params = useParams();
  const clientId = params?.id as string;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pautas</h1>
          <p className="text-sm text-muted-foreground">
            Crie pautas estruturadas para repassar ao time no ClickUp.
          </p>
        </div>

        <ModalForm
          title="Nova pauta"
          endpoint="pauta"
          schema={pautaFormSchema}
          fields={[
            { name: "clientId", label: "", type: "hidden", defaultValue: clientId },
            ...pautaFields,
          ]}
          buttonLabel="Criar pauta"
          cols={2}
        />
      </div>

      <TableView
        endpoint="pauta"
        columns={pautaColumns}
        queryParams={{ clientId }}
      />
    </div>
  );
}
