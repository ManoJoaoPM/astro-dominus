// src/app/api/commercial/scraper-job/[[...id]]/route.ts
import {
  ScraperJob,
  ScraperJobInterface,
  scraperJobCreateSchema,
  scraperJobUpdateSchema,
} from "@/models/commercial/scraper-job/model";
import { CRUDController } from "@/struct";

function sanitizeScraperJob(job: ScraperJobInterface) {
  return {
    _id: job._id,
    query: job.query,
    city: job.city,
    state: job.state,
    status: job.status,
    totalLeads: job.totalLeads,
    withEmail: job.withEmail,
    withPhone: job.withPhone,
    withWebsite: job.withWebsite,
    withInstagram: job.withInstagram,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    errorMessage: job.errorMessage,
  } as any;
}

export const {
  GET,
  POST,
  PATCH,
  DELETE,
  dynamic,
  runtime,
} = new CRUDController<ScraperJobInterface>(ScraperJob, {
  createSchema: scraperJobCreateSchema,
  updateSchema: scraperJobUpdateSchema,
  softDelete: false,
  hooks: {
    // formata a resposta SEM vazar nada extra do Mongoose
    beforeSend: async (data) => {
      if (Array.isArray(data)) return data.map(sanitizeScraperJob);
      if (!data) return data;
      return sanitizeScraperJob(data as ScraperJobInterface);
    },
  },
  roles: {
    GET: ["admin", "operational"],
    POST: ["admin", "operational"],
    PATCH: ["admin", "operational"],
    DELETE: ["admin"],
  },
});
