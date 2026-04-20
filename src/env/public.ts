import z from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().optional().default(""),
  NEXT_PUBLIC_APP_URL: z.string().optional().default(""),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export const PUBLIC_ENV: PublicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

