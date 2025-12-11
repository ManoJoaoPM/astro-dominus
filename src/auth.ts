import { CustomSession } from "@/services/auth/utils";
import { AuthService } from "@/services/auth";
import { authConfig } from "@/services/auth/config";
import NextAuth from "next-auth";

// Aqui é útil ter o tipo de role centralizado
export type UserRole = "admin" | "operational" | "commercial";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    async jwt({ token, user }: any) {
      // Esse callback roda toda vez que o JWT é gerado/atualizado.
      // Quando "user" existe, é primeira vez (login).
      if (user) {
        // 👇 Default de papel para novos usuários (via OAuth, etc.)
        const defaultRole: UserRole = "operational";

        const { status, user: original } = await AuthService.getUserOrCreate({
          id: user?.id as string,
          name: user?.name as string,
          email: user?.email,
          avatar: user?.picture, // geralmente vem assim do provider
          role: defaultRole,     // 👈 deixa o backend decidir se mantém/ignora
        });

        if (!status) {
          throw new Error("User doesn't exist");
        }

        // Garante que o role que vai pra token vem do banco
        const role: UserRole =
          (original.role as UserRole) || defaultRole;

        token.user = {
          _id: original._id,
          id: user.id,             // id do provider (Google, etc.)
          name: original.name ?? user.name,
          email: original.email ?? user.email,
          role,
          status: original.status,
          avatar: original.avatar ?? user.picture ?? null,
        };
      }

      return token;
    },

    async session({ session, token }: any) {
      // Quando o usuário já tem token.user, replicamos para a session
      if (token?.user) {
        session.user = token.user;
        session._id = token.user._id;
        session.id = token.user._id;
        session.providerId = token.user.id;
        // Só pra garantir que role e status sempre existem no objeto de sessão
        if (!session.user.role) {
          (session.user as any).role = "operational";
        }
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      const safeUrl = new URL(url);
      return safeUrl.origin === baseUrl ? url : baseUrl;
    },
  },
});

export const getSession = async (): Promise<CustomSession> => {
  const DEFAULT_SESSION = { user: { role: "*" } } as unknown as CustomSession;

  try {
    const session = (await auth()) as CustomSession;
    return session || DEFAULT_SESSION;
  } catch (error) {
    console.error(error);
    return DEFAULT_SESSION;
  }
};

export const providerMap = authConfig.providers
  .map((provider: any) => {
    if (typeof provider === "function") {
      const providerData = provider();
      return { id: providerData.id, name: providerData.name };
    }
    return { id: provider.id, name: provider.name };
  })
  .filter((provider: any) => provider.id !== "credentials");
