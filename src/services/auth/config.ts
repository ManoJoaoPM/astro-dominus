import { CredentialsProvider } from "@/services/auth/credentials";
import { GoogleProvider } from "@/services/auth/google";
import { NextAuthConfig } from "next-auth";
import { ENV } from "@/env";

export const publicRoutes = [
  "/auth",
  "/favicon.ico",
  "/robots.txt",
  "/_next/static",
  "/_next/image",
  "/api/public",
  "/fonts",
  "/images",
  "/icon",
  "/api",
  ".png",
  ".jpg",
  ".jpeg",
  ".json",
  ".svg",
  ".webp",
  ".ico",
];

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
