// src/app/api/astro/clients/[[...id]]/route.ts
import crypto from "crypto";
import {
  Client,
  ClientInterface,
  clientFormSchema,
  clientUpdateSchema,
} from "@/models/client/model";
import { CRUDController, HookContext } from "@/struct";

function generateApprovalToken() {
  return crypto.randomBytes(16).toString("hex");
}

function sanitizeClient(client: ClientInterface) {
  return {
    _id: client._id,
    name: client.name,
    responsible: client.responsible,
    email: client.email,
    whatsapp: client.whatsapp,
    city: client.city,
    state: client.state,
    niche: client.niche,
    approvalToken: client.approvalToken,
    status: client.status,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
  } as any;
}

export const { GET, POST, DELETE, PATCH, dynamic, runtime } = new CRUDController(Client, {
  createSchema: clientFormSchema,
  updateSchema: clientUpdateSchema,
  softDelete: true,
  hooks: {
    beforeSend: async (data) => {
      if (Array.isArray(data)) return data.map(sanitizeClient);
      if (!data) return data;
      return sanitizeClient(data as ClientInterface);
    },
    beforeCreate: async ({ data }: HookContext<ClientInterface>) => {
      if (!data.approvalToken) {
        return { approvalToken: generateApprovalToken() };
      }
    },
    // garantir que nunca apague o token num update
    beforeUpdate: async ({ data }: HookContext<ClientInterface>) => {
      if (data && "approvalToken" in data && !data.approvalToken) {
        // impede limpar o token
        delete (data as any).approvalToken;
      }
    },
  },
  // ajuste depois conforme seu sistema de roles
  roles: {
    GET: ["admin", "operational", "commercial"],
    POST: ["admin", "operational"],
    PATCH: ["admin", "operational"],
    DELETE: ["admin"],
  },
});
