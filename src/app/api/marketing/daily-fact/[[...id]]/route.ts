import {
  MarketingDailyFact,
  MarketingDailyFactInterface,
  marketingDailyFactSchema,
} from "@/models/marketing/daily-fact/model";
import { CRUDController } from "@/struct";

export const {
  GET,
  POST,
  PATCH,
  DELETE,
  dynamic,
  runtime,
} = new CRUDController<MarketingDailyFactInterface>(MarketingDailyFact, {
  createSchema: marketingDailyFactSchema,
  updateSchema: marketingDailyFactSchema.partial(),
  roles: {
    GET: ["admin", "operational", "commercial"],
    POST: ["admin"], // Normally only created by system/sync
    PATCH: ["admin"],
    DELETE: ["admin"],
  },
  // Allow filtering by integrationId and date range
  sort: { date: 1 },
  hooks: {
    beforeGet: async ({ query }) => {
      const { integrationId } = query;

      if (!integrationId || integrationId === "undefined" || integrationId === "null") {
        throw new Error("Invalid integrationId");
      }
    },
  },
});
