// src/components/client-edit-modal.tsx
"use client";

import { ModalForm } from "@discovery-solutions/struct/client";
import { clientFormSchema, clientFields } from "@/models/client/utils";

export function ClientEditModal() {
  return (
    <ModalForm
      title="Editar cliente"
      endpoint="client"                // API: /api/client/[id]
      schema={clientFormSchema}
      fields={clientFields}
      buttonLabel="Salvar alterações"
      cols={2}
    />
  );
}
