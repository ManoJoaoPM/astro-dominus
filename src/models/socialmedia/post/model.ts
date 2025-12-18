import { db, Schema } from "@/lib/mongoose";
import { SocialPostInterface } from "@/models/socialmedia/post";

export * from "@/models/socialmedia/post";

const schema = new Schema<SocialPostInterface>({
  clientId: { type: String, required: true },

  format: {
    type: String,
    enum: ["carousel", "reels", "static", "video", "ad", "other"],
    required: true,
  },
  title: { type: String, required: true },
  internalNotes: { type: String, default: null },
  caption: { type: String, required: true },

  publishDate: { type: Date, required: true },

  contentFolderUrl: { type: String, default: null },
  coverUrl: { type: String, default: null },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "revision_sent"],
    default: "pending",
    index: true,
  },

  rejectionReason: { type: String, default: null },
  revisionRequest: { type: String, default: null },

  publicApprovalToken: { type: String, default: null, index: true },
  publicApprovalEnabled: { type: Boolean, default: false, index: true },
  publicApprovalExpiresAt: { type: Date, default: null },


  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null },
});

export const SocialPost =
  db?.models?.SocialPost || db.model<SocialPostInterface>("SocialPost", schema);
