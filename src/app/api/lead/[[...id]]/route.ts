import { Lead, LeadInterface, leadFormSchema, leadUpdateSchema } from "@/models/commercial/lead/model";
import { CRUDController, HookContext } from "@/struct";

function sanitizeLead(lead: LeadInterface) {
  return {
    _id: lead._id,
    name: lead.name,
    email: lead.email,
    status: lead.status,
    instagram: lead.instagram,
    website: lead.website,
    qualificationStatus: lead.qualificationStatus,
    potentialService: lead.potentialService,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  } as any;
}

export const { GET, POST, PATCH, DELETE, dynamic, runtime } =
  new CRUDController<LeadInterface>(Lead, {
    createSchema: leadFormSchema,
    updateSchema: leadUpdateSchema,
    softDelete: true,

     hooks: {
      beforeCreate: async ({ data }: HookContext<LeadInterface>) => data,
      beforeUpdate: async ({ data }: HookContext<LeadInterface>) => {
        console.log("[beforeUpdate] data recebido:", data);
        return data;
      },
      beforeSend: async (data) => {
        if (Array.isArray(data)) return data.map(sanitizeLead);
        return sanitizeLead(data as LeadInterface);
      },
    },

    roles: {
      GET: ["admin"],
      POST: ["admin"],
      PATCH: ["admin"],
      DELETE: ["admin"],
    },
  });
