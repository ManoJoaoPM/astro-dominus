"use client";

import { ModelForm } from "@discovery-solutions/struct/client";
import { clientFormSchema, clientFields } from "@/models/client/utils";

export default function NewClientPage() {
  return (
    <div className="space-y-4 max-w-4xl">
      <h1 className="text-2xl font-semibold">Novo cliente (imobiliária)</h1>
      <p className="text-sm text-muted-foreground">
        Cadastre as informações estratégicas da imobiliária. Isso será usado nas linhas editoriais e no planejamento.
      </p>

      <ModelForm
        endpoint="client"
        schema={clientFormSchema}
        fields={clientFields}
        mode="register"
        cols={2}
        buttonLabel="Salvar cliente"
      />
    </div>
  );
}
