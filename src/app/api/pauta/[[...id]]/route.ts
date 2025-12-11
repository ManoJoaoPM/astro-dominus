// src/app/api/astro/pautas/[[...id]]/route.ts
import {
  Pauta,
  PautaInterface,
  pautaFormSchema,
  pautaUpdateSchema,
} from "@/models/socialmedia/pauta/model";
import { CRUDController } from "@/struct";

function sanitizePauta(pauta: PautaInterface) {
  return {
    _id: pauta._id,
    clientId: pauta.clientId,
    editorialLineId: pauta.editorialLineId,
    title: pauta.title,
    copy: pauta.copy,
    hooks: pauta.hooks,
    cta: pauta.cta,
    structure: pauta.structure,
    references: pauta.references,
    notes: pauta.notes,
    createdAt: pauta.createdAt,
    updatedAt: pauta.updatedAt,
  } as any;
}

export const { GET, POST, DELETE, PATCH, dynamic, runtime } = new CRUDController(
  Pauta,
  {
    createSchema: pautaFormSchema,
    updateSchema: pautaUpdateSchema,
    softDelete: true,
    hooks: {
      beforeSend: async (data) => {
        if (Array.isArray(data)) return data.map(sanitizePauta);
        if (!data) return data;
        return sanitizePauta(data as PautaInterface);
      },
    },
    roles: {
      GET: ["admin", "operational"],
      POST: ["admin", "operational"],
      PATCH: ["admin", "operational"],
      DELETE: ["admin"],
    },
  }
);
