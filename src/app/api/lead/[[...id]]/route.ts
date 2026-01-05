import {
  CommercialLead,
  CommercialLeadInterface,
  commercialLeadFormSchema,
  commercialLeadUpdateSchema,
} from "@/models/commercial/lead/model";
import { CRUDController } from "@/struct";

function sanitizeCommercialLead(lead: CommercialLeadInterface) {
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
  softDelete: true,
  hooks: {
    beforeSend: async (data) => {
      if (Array.isArray(data)) return data.map(sanitizeCommercialLead);
      if (!data) return data;
      return sanitizeCommercialLead(data as CommercialLeadInterface);
    },
  },
  roles: {
    // leitura liberada pra todo mundo do comercial/operacional/admin
    GET: ["admin", "operational", "commercial"],
    // criação/edição só pra admin + operacional
    POST: ["admin", "operational"],
    PATCH: ["admin", "operational"],
    // exclusão só admin
    DELETE: ["admin"],
  },
});
