import {
  MarketingIntegration,
  MarketingIntegrationInterface,
  marketingIntegrationSchema,
} from "@/models/marketing/integration/model";
import { User } from "@/models/identity/user/model";
import { CRUDController } from "@/struct";

export const {
  GET,
  POST,
  PATCH,
  DELETE,
  dynamic,
  runtime,
} = new CRUDController<MarketingIntegrationInterface>(
  MarketingIntegration,
  {
    createSchema: marketingIntegrationSchema,
    updateSchema: marketingIntegrationSchema.partial(),

    roles: {
      GET: ["admin", "operational", "commercial"],
      POST: ["admin", "operational"],
      PATCH: ["admin", "operational"],
      DELETE: ["admin"],
    },

    hooks: {
      /**
       * GET
       * - filtra por clientId e provider via querystring
       * - retorna sempre no formato { data }
       */
      beforeGet: async ({ query }) => {
        // 1. Map integrationId to _id if present
        if (query.integrationId && query.integrationId !== "undefined") {
          query._id = query.integrationId;
          delete query.integrationId;
        }

        // 2. Ensure clientId and provider are preserved (Struct handles them automatically via searchParams)
        // No explicit mapping needed as they are already in 'query' object.
      },

      /**
       * POST
       * - fallback do accessToken do usuário
       * - UPSERT por clientId + provider + adAccountId
       */
      beforeCreate: async ({ data, user }) => {
        if (!data) {
          throw new Error("Data is required");
        }
        // fallback de accessToken
        if (!data.accessToken && user?._id) {
          const userWithToken = await User.findById(user._id).select(
            "+metaAccessToken"
          );

          if (userWithToken?.metaAccessToken) {
            data.accessToken = userWithToken.metaAccessToken;
          }
        }

        if (!data.accessToken) {
          throw new Error(
            "Access Token is required (and not found in user profile)"
          );
        }

        // BLOQUEIA criação padrão → vamos usar UPSERT
        return false;
      },

      /**
       * UPSERT real após bloqueio do create padrão
       */
      afterCreate: async ({ data }) => {
        const filter = {
          clientId: data?.clientId,
          provider: data?.provider,
          adAccountId: data?.adAccountId,
        };

        const integration =
          await MarketingIntegration.findOneAndUpdate(
            filter,
            {
              ...data,
              status: "active",
              errorMessage: null,
              updatedAt: new Date(),
            },
            {
              upsert: true,
              new: true,
              setDefaultsOnInsert: true,
            }
          );

        return integration;
      },
    },
  }
);
