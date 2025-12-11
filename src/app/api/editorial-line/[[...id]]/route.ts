// src/app/api/astro/editorial-lines/[[...id]]/route.ts
import {
  EditorialLine,
  EditorialLineInterface,
  editorialLineFormSchema,
  editorialLineUpdateSchema,
} from "@/models/socialmedia/editorial-line/model";
import { CRUDController } from "@/struct";

function sanitizeEditorialLine(line: EditorialLineInterface) {
  return {
    _id: line._id,
    clientId: line.clientId,
    name: line.name,
    objective: line.objective,
    description: line.description,
    frequency: line.frequency,
    examples: line.examples,
    notes: line.notes,
    createdAt: line.createdAt,
    updatedAt: line.updatedAt,
  } as any;
}

export const { GET, POST, DELETE, PATCH, dynamic, runtime } = new CRUDController(
  EditorialLine,
  {
    createSchema: editorialLineFormSchema,
    updateSchema: editorialLineUpdateSchema,
    softDelete: true,
    hooks: {
      beforeSend: async (data) => {
        if (Array.isArray(data)) return data.map(sanitizeEditorialLine);
        if (!data) return data;
        return sanitizeEditorialLine(data as EditorialLineInterface);
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
