import { db, Schema } from "@/lib/mongoose";
import { ReportBlockInterface } from "./index";

export * from "./index";

const schema = new Schema<ReportBlockInterface>(
  {
    reportId: { type: Schema.Types.ObjectId, ref: "Report", required: true, index: true },
    templateId: { type: String, required: true },
    order: { type: Number, default: 0 },
    
    config: {
      metricsSelected: { type: [String], default: [] },
      title: { type: String },
      filters: { type: Map, of: Schema.Types.Mixed },
    },
  },
  { timestamps: true }
);

// Index for efficient ordering queries
schema.index({ reportId: 1, order: 1 });

export const ReportBlock =
  db?.models?.ReportBlock ||
  db.model<ReportBlockInterface>("ReportBlock", schema);
