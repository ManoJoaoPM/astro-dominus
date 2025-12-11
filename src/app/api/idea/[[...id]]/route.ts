// src/app/api/astro/ideas/[[...id]]/route.ts
import {
  Idea,
  IdeaInterface,
  ideaFormSchema,
  ideaUpdateSchema,
} from "@/models/socialmedia/idea/model";
import { CRUDController } from "@/struct";

function sanitizeIdea(idea: IdeaInterface) {
  return {
    _id: idea._id,
    clientId: idea.clientId,
    editorialLineId: idea.editorialLineId,
    title: idea.title,
    description: idea.description,
    format: idea.format,
    tags: idea.tags,
    status: idea.status,
    createdAt: idea.createdAt,
    updatedAt: idea.updatedAt,
  } as any;
}

export const { GET, POST, DELETE, PATCH, dynamic, runtime } = new CRUDController(Idea, {
  createSchema: ideaFormSchema,
  updateSchema: ideaUpdateSchema,
  softDelete: true,
  hooks: {
    beforeSend: async (data) => {
      if (Array.isArray(data)) return data.map(sanitizeIdea);
      if (!data) return data;
      return sanitizeIdea(data as IdeaInterface);
    },
  },
  roles: {
    GET: ["admin", "operational"],
    POST: ["admin", "operational"],
    PATCH: ["admin", "operational"],
    DELETE: ["admin"],
  },
});
