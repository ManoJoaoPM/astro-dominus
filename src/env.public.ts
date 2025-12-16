// src/env.public.ts
import z from "zod";

export const envPublicSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

export type EnvPublic = z.infer<typeof envPublicSchema>;

const parsed = envPublicSchema.safeParse({
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

if (!parsed.success) {
  console.error(
    "Erro na validação das variáveis de ambiente (public):",
    parsed.error.flatten().fieldErrors
  );
  throw new Error("Erro na validação das variáveis de ambiente (public).");
}

export const ENV_PUBLIC = parsed.data;
