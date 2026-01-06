import {
  CommercialLead,
  CommercialLeadInterface,
  commercialLeadFormSchema,
  commercialLeadUpdateSchema,
} from "@/models/commercial/lead/model";
import { CRUDController, HookContext } from "@/struct";

function sanitizeLead(lead: CommercialLeadInterface) {
  return {
    _id: lead._id,
    name: lead.name,
    city: lead.city,
    state: lead.state,
    address: lead.address,
    phone: lead.phone,
    email: lead.email,
    website: lead.website,
    instagram: lead.instagram,
    source: lead.source,
    qualificationStatus: lead.qualificationStatus,
    qualificationNotes: lead.qualificationNotes,
    potentialService: lead.potentialService,
    scraperJobId: lead.scraperJobId,
    lat: lead.lat,
    lng: lead.lng,
    geocodeStatus: lead.geocodeStatus,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  } as any;
}

export const {
  GET,
  POST,
  PATCH,
  DELETE,
  dynamic,
  runtime,
} = new CRUDController<CommercialLeadInterface>(CommercialLead, {
  createSchema: commercialLeadFormSchema,
  updateSchema: commercialLeadUpdateSchema,
  softDelete: false, // Alterado para false para garantir exclusão física por enquanto, ou verificar filtro de deletados no GET
  hooks: {
    beforeSend: async (data) => {
      if (Array.isArray(data)) return data.map(sanitizeLead);
      if (!data) return data;
      return sanitizeLead(data as CommercialLeadInterface);
    },
  },
  roles: {
    GET: ["admin", "operational", "commercial"],
    POST: ["admin", "operational", "commercial"],
    PATCH: ["admin", "operational", "commercial"],
    DELETE: ["admin", "commercial"],
  },
  // Permite filtrar por scraperJobId na query string e ordenar
  sort: { createdAt: -1 }
});
