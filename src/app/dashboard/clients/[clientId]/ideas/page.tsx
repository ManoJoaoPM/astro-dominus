"use client";

import { useParams } from "next/navigation";
import { TableView, ModalForm } from "@discovery-solutions/struct/client";
import { ideaColumns, ideaFields, ideaFormSchema } from "@/models/socialmedia/idea/utils";

export default function ClientIdeasPage() {
  const params = useParams();
  const clientId = params?.clientId as string;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Banco de ideias</h1>
          <p className="text-sm text-muted-foreground">
            Centralize as ideias de conteúdo deste cliente para usar nas pautas e no planejamento.
          </p>
        </div>

        <ModalForm
          title="Nova ideia"
          endpoint="idea"
          schema={ideaFormSchema}
          fields={[
            { name: "clientId", label: "", type: "hidden", defaultValue: clientId },
            ...ideaFields,
          ]}
          buttonLabel="Adicionar ideia"
          cols={2}
        />
      </div>

      <TableView
        endpoint="idea"
        columns={ideaColumns}
        queryParams={{ clientId }}
      />
    </div>
  );
}
