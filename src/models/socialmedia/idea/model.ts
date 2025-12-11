// src/models/astro/idea/model.ts
import { db, Schema } from "@/lib/mongoose";
import { IdeaInterface } from "@/models/socialmedia/idea";

export * from "@/models/socialmedia/idea";

const schema = new Schema<IdeaInterface>({
  clientId: { type: String, ref: "Client", required: true },
  editorialLineId: {
    type: Schema.Types.ObjectId,
    ref: "EditorialLine",
    required: false,
  },

  title: { type: String, required: true },
  description: { type: String, default: null },
  format: {
    type: String,
    enum: ["reels", "carousel", "video", "ad", "story"],
    required: false,
  },
  tags: { type: [String], default: [] },
  references: { type: [String], default: [] },
  notes: { type: String, default: null },
  status: {
    type: String,
    enum: ["draft", "validated", "archived"],
    default: "draft",
    index: true,
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, required: false, default: null },
});

export const Idea = db?.models?.Idea || db.model<IdeaInterface>("Idea", schema);
