import { CredentialsProvider } from "@/services/auth/credentials";
import { GoogleProvider } from "@/services/auth/google";
import { NextAuthConfig } from "next-auth";
import { ENV } from "@/env";
export { publicRoutes } from "@/services/auth/public-routes";

export const authConfig = {
  providers: [
    CredentialsProvider,
    GoogleProvider,
  ],
  secret: ENV.AUTH_SECRET,
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  pages: {
    signIn: "/auth",
    signOut: "/auth/signout",
    verifyRequest: "/auth?status=success",
    error: "/auth/error",
  },
} as NextAuthConfig;
