import { Report, ReportInterface, reportSchema } from "@/models/marketing/report/model";
import { CRUDController } from "@/struct";
import { nanoid } from "nanoid";

export const {
  GET,
  POST,
  PATCH,
  DELETE,
  dynamic,
  runtime,
} = new CRUDController<ReportInterface>(Report, {
  createSchema: reportSchema,
  updateSchema: reportSchema.partial(),
  roles: {
    GET: ["admin", "operational", "commercial"],
    POST: ["admin", "operational"],
    PATCH: ["admin", "operational"],
    DELETE: ["admin"],
  },
  hooks: {
    beforeCreate: async ({ data }) => {
      if (!data) return data;
      if (!data.slug) {
        data.slug = nanoid(10); // Generate unique slug
      }
      return data;
    },
    beforeGet: async ({ query }) => {
      // Map 'clientId' from query to filter
      if (query.clientId && query.clientId !== "undefined") {
        query.clientId = query.clientId;
      }
    }
  },
  sort: { createdAt: -1 },
});
