// src/models/astro/editorial-line/model.ts
import { db, Schema } from "@/lib/mongoose";
import { EditorialLineInterface } from "@/models/socialmedia/editorial-line";

export * from "@/models/socialmedia/editorial-line";

const schema = new Schema<EditorialLineInterface>({
  clientId: { type: String, ref: "Client", required: true },
  name: { type: String, required: true },
  objective: { type: String, default: null },
  description: { type: String, default: null },
  frequency: { type: String, default: null },
  examples: { type: [String], default: [] },
  notes: { type: String, default: null },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, required: false, default: null },
});

export const EditorialLine =
  db?.models?.EditorialLine ||
  db.model<EditorialLineInterface>("EditorialLine", schema);
