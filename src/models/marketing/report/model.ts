import { db, Schema } from "@/lib/mongoose";
import { ReportInterface } from "./index";

export * from "./index";

const schema = new Schema<ReportInterface>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    isPublic: { type: Boolean, default: false },
    
    dateRange: {
      period: { type: String, default: "last_30d" },
      startDate: { type: Date },
      endDate: { type: Date },
    },
  },
  { timestamps: true }
);

export const Report =
  db?.models?.Report ||
  db.model<ReportInterface>("Report", schema);
