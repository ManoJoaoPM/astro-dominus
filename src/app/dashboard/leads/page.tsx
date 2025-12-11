"use client";

import { SiteHeader } from "@/components/site-header";
import {
  ModalFormProvider,
  ModalForm,
  TableView,
} from "@discovery-solutions/struct/client";

import {
  commercialLeadFormSchema,
  commercialLeadColumns,
  commercialLeadFields,
} from "@/models/commercial/lead/utils";

export default function Page() {
  return (
    <div className="w-full">
      <SiteHeader
        heading={[
          { link: "/dashboard/leads", label: "Leads" },
        ]}
      />

      <ModalFormProvider>
        {/* TABELA DE LEADS */}
        <div className="px-4">
          <TableView
            asChild
            columns={commercialLeadColumns}
            endpoint="lead"
            modalId="lead"
          />
        </div>

        {/* MODAL DE CRIAR/EDITAR */}
        <ModalForm
          schema={commercialLeadFormSchema}
          fields={commercialLeadFields}
          endpoint="lead"
          modalId="lead"
          title="Registrar/Editar Lead"
          buttonLabel="Salvar"
          cols={3}
        />
      </ModalFormProvider>
    </div>
  );
}
