import { db, Schema } from "@/lib/mongoose";
import {
  ScraperJobInterface,
} from "@/models/commercial/scraper-job";

export * from "@/models/commercial/scraper-job";

const schema = new Schema<ScraperJobInterface>({
  query: { type: String, required: true },
  city: { type: String, default: null },
  state: { type: String, default: null },

  status: {
    type: String,
    enum: ["pending", "running", "completed", "failed"],
    default: "pending",
    index: true,
  },

  totalLeads: { type: Number, default: 0 },
  withEmail: { type: Number, default: 0 },
  withPhone: { type: Number, default: 0 },
  withWebsite: { type: Number, default: 0 },
  withInstagram: { type: Number, default: 0 },

  startedAt: { type: Date, default: Date.now },
  finishedAt: { type: Date, default: null },

  errorMessage: { type: String, default: null },
});

export const ScraperJob =
  db?.models?.ScraperJob ||
  db.model<ScraperJobInterface>("ScraperJob", schema);
