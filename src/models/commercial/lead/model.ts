import { db, Schema } from "@/lib/mongoose";
import {
  CommercialLeadInterface,
} from "@/models/commercial/lead";

export * from "@/models/commercial/lead";

const schema = new Schema<CommercialLeadInterface>({
  name: { type: String, required: true },

  city: { type: String, default: null },
  state: { type: String, default: null },
  address: { type: String, default: null },

  phone: { type: String, default: null },
  email: { type: String, default: null },
  website: { type: String, default: null },
  instagram: { type: String, default: null },

  source: {
    type: String,
    enum: ["scraper", "manual"],
    default: "scraper",
    index: true,
  },

  qualificationStatus: {
    type: String,
    enum: ["pending", "qualified", "unqualified"],
    default: "pending",
    index: true,
  },

  qualificationNotes: { type: String, default: null },

  scraperJobId: {
    type: Schema.Types.ObjectId,
    ref: "ScraperJob",
    required: false,
    default: null,
  },

  lat: { type: Number, default: null, index: true },
  lng: { type: Number, default: null, index: true },
  geocodeStatus: { type: String, enum: ["pending","ok","failed"], default: "pending", index: true },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// importante pra não recriar o model no hot reload
export const CommercialLead =
  db?.models?.CommercialLead ||
  db.model<CommercialLeadInterface>("CommercialLead", schema);
