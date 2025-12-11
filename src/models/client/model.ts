// src/models/astro/client/model.ts
import { db, Schema } from "@/lib/mongoose";
import { ClientInterface } from "@/models/client";

export * from "@/models/client";

const schema = new Schema<ClientInterface>({
  name: { type: String, required: true },
  responsible: { type: String, required: true },
  email: { type: String, required: true },

  phone: { type: String, default: null },
  whatsapp: { type: String, default: null },
  cnpj: { type: String, default: null },
  city: { type: String, default: null },
  state: { type: String, default: null },
  website: { type: String, default: null },
  portals: { type: [String], default: [] },

  niche: { type: String, default: null },
  regions: { type: [String], default: [] },
  differentials: { type: String, default: null },
  targetAudience: { type: String, default: null },
  toneOfVoice: { type: String, default: null },
  forbiddenWords: { type: [String], default: [] },

  brandColors: { type: [String], default: [] },
  logoUrl: { type: String, default: null },
  brandFonts: { type: [String], default: [] },

  documents: {
    type: [
      {
        type: { type: String, default: null },
        url: { type: String, required: true },
      },
    ],
    default: [],
  },

  approvalToken: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  status: {
    type: String,
    enum: ["active", "paused", "closed"],
    default: "active",
    index: true,
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, required: false, default: null },
});

export const Client = db?.models?.Client || db.model<ClientInterface>("Client", schema);
