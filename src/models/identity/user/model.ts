import { db, Schema } from "@/lib/mongoose";
import { UserInterface } from "@/models/identity/user";

export * from "@/models/identity/user";

const schema = new Schema<UserInterface>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  role: {
    type: String,
    enum: ["admin", "operational", "commercial"],
    default: "operational",
    index: true,
  },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  avatar: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, required: false, default: null },
});

export const User = db?.models?.User || db.model<UserInterface>("User", schema);
