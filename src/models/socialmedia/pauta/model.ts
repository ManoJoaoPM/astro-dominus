// src/models/astro/pauta/model.ts
import { db, Schema } from "@/lib/mongoose";
import { PautaInterface } from "@/models/socialmedia/pauta";

export * from "@/models/socialmedia/pauta";

const schema = new Schema<PautaInterface>({
  clientId: { type: String, ref: "Client", required: true },
  editorialLineId: {
    type: Schema.Types.ObjectId,
    ref: "EditorialLine",
    required: false,
  },

  title: { type: String, required: true },
  copy: { type: String, default: null },
  hooks: { type: [String], default: [] },
  cta: { type: String, default: null },
  structure: { type: String, default: null },
  references: { type: [String], default: [] },
  notes: { type: String, default: null },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, required: false, default: null },
});

export const Pauta = db?.models?.Pauta || db.model<PautaInterface>("Pauta", schema);
