// src/env.server.ts
import "server-only";
import z from "zod";

// Em desenvolvimento, carregamos o .env local
if (process.env.NODE_ENV !== "production") {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("dotenv").config();
}

export const envServerSchema = z.object({
  NODE_ENV: z.string().default("development"),

  MONGODB_URI: z.string().min(6),
  MONGODB_NAME: z.string().min(3),

  AUTH_SECRET: z.string().min(16),
  AUTH_URL: z.string().url(),

  PLATFORM_API_KEY: z.string().min(16),

  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),

  OPENAI_API_KEY: z.string().min(32).optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),

  DATAFORSEO_LOGIN: z.string(),
  DATAFORSEO_PASSWORD: z.string(),
});

export type EnvServer = z.infer<typeof envServerSchema>;

const SKIP_ENV_VALIDATION = process.env.SKIP_ENV_VALIDATION === "true";

const parsed = SKIP_ENV_VALIDATION
  ? ({ success: true, data: process.env } as const)
  : envServerSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Erro na validação das variáveis de ambiente (server):",
    parsed.error.flatten().fieldErrors
  );
  throw new Error("Erro na validação das variáveis de ambiente (server).");
}

const data = parsed.data as unknown as EnvServer;

interface PickerParams {
  development: any;
  production: any;
  test?: any;
}

export const ENV_SERVER = {
  ...data,
  picker: (params: PickerParams) => {
    const key = data.NODE_ENV || "development";
    return params[key as keyof typeof params] ?? params.development;
  },
} as EnvServer & { picker: (params: PickerParams) => any };
