import { NextAuthConfig } from "next-auth";

export const authEdgeConfig = {
  providers: [],
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/auth",
    signOut: "/auth/signout",
    verifyRequest: "/auth?status=success",
    error: "/auth/error",
  },
} as NextAuthConfig;
