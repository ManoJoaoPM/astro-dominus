import {
  SocialPost,
  SocialPostInterface,
  socialPostFormSchema,
  socialPostUpdateSchema,
} from "@/models/socialmedia/post/model";
import { CRUDController } from "@/struct";

function sanitizeSocialPost(post: SocialPostInterface) {
  return {
    _id: post._id,
    clientId: post.clientId,
    format: post.format,
    title: post.title,
    internalNotes: post.internalNotes,
    caption: post.caption,
    publishDate: post.publishDate,
    contentFolderUrl: post.contentFolderUrl,
    mediaUrls: post.mediaUrls,
    status: post.status,
    rejectionReason: post.rejectionReason,
    revisionRequest: post.revisionRequest,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  } as any;
}

export const { GET, POST, PATCH, DELETE, dynamic, runtime } =
  new CRUDController(SocialPost, {
    createSchema: socialPostFormSchema,
    updateSchema: socialPostUpdateSchema,
    softDelete: true,
    hooks: {
      beforeSend: async (data) => {
        if (Array.isArray(data)) return data.map(sanitizeSocialPost);
        if (!data) return data;
        return sanitizeSocialPost(data as SocialPostInterface);
      },
    },
    roles: {
      GET: ["admin", "operational"],
      POST: ["admin", "operational"],
      PATCH: ["admin", "operational"],
      DELETE: ["admin"],
    },
  });
