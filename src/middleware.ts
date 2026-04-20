import { NextResponse } from "next/server";
import { authEdgeConfig } from "@/services/auth/config-edge";
import NextAuth from "next-auth";

const { auth } = NextAuth({ ...authEdgeConfig, providers: authEdgeConfig.providers ?? [] });

export const middleware = auth(async (request) => {
  const pathname = request.nextUrl.pathname;
  const res = NextResponse.next();

  const isSignOutPage = pathname.includes("/signout");
  const isDashboard = pathname.startsWith("/dashboard");
  const isAuthPage = pathname.startsWith("/auth");

  // usuário logado tentando acessar /auth → redireciona
  if (request.auth && isAuthPage && !isSignOutPage) {
    const callbackUrl = request.nextUrl.searchParams.get("callbackUrl") || null;
    return NextResponse.redirect(
      new URL(callbackUrl || "/dashboard", request.nextUrl.origin)
    );
  }

  // usuário não logado tentando acessar /dashboard → redireciona
  if (!request.auth && isDashboard && !isAuthPage) {
    return NextResponse.redirect(
      new URL(`/auth?callbackUrl=${pathname}`, request.nextUrl.origin)
    );
  }

  return res;
});

export const config = {
  matcher: [
    '/:path((?!_next|favicon|robots|.*\\.(?:png|jpg|jpeg|json|svg|webp|ico)).*)',
  ],
};
