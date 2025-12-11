// src/env.ts
import "server-only"; // garante que isso nunca vá pro bundle do client
import z from "zod";

// Em desenvolvimento, carregamos o .env local
if (process.env.NODE_ENV !== "production") {
  // Se não tiver dotenv instalado: npm install dotenv
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("dotenv").config();
}

export const envSchema = z.object({
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
  NEXT_PUBLIC_APP_NAME: z.string(),
  NEXT_PUBLIC_APP_URL: z.string(),
  DATAFORSEO_LOGIN: z.string(),
  DATAFORSEO_PASSWORD: z.string(),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Só loga no servidor
  console.error(
    "Erro na validação das variáveis de ambiente:",
    parsed.error.flatten().fieldErrors
  );
  throw new Error("Erro na validação das variáveis de ambiente.");
}

// Aqui já temos tudo validado
const data = parsed.data;

interface PickerParams {
  development: any;
  production: any;
  test?: any;
}

export const ENV = {
  ...data,
  picker: (params: PickerParams) => {
    const key = data.NODE_ENV || "development";
    return params[key as keyof typeof params] ?? params.development;
  },
} as Env & { picker: (params: PickerParams) => any };
