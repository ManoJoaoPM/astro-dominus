// src/models/astro/monthly-plan/model.ts
import { db, Schema } from "@/lib/mongoose";
import { MonthlyPlanInterface } from "@/models/socialmedia/monthly-plan";

export * from "@/models/socialmedia/monthly-plan";

const schema = new Schema<MonthlyPlanInterface>({
  clientId: { type: String, ref: "Client", required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },

  items: {
    type: [
      {
        day: Number,
        editorialLineId: {
          type: Schema.Types.ObjectId,
          ref: "EditorialLine",
          required: false,
        },
        format: { type: String, required: false },
        notes: { type: String, required: false },
        pautaId: {
          type: Schema.Types.ObjectId,
          ref: "Pauta",
          required: false,
        },
      },
    ],
    default: [],
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, required: false, default: null },
});

export const MonthlyPlan =
  db?.models?.MonthlyPlan ||
  db.model<MonthlyPlanInterface>("MonthlyPlan", schema);
