import { MetaAdsApi } from "@/services/meta/api";
import { User } from "@/models/identity/user/model";
import { withSession } from "@/struct";

export const POST = withSession(
  async ({ user }, req: Request) => {
    if (!user?._id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const body = await req.json().catch(() => ({} as any));
      let accessToken: string | undefined = body?.accessToken;

      // Fallback do token armazenado no perfil do usuário
      if (!accessToken) {
        const userWithToken = await User.findById(user._id).select("+metaAccessToken");
        if (userWithToken?.metaAccessToken) {
          accessToken = userWithToken.metaAccessToken;
        }
      }

      if (!accessToken) {
        return Response.json(
          { error: "Access Token is required (and not found in user profile)" },
          { status: 400 }
        );
      }

      const api = new MetaAdsApi(accessToken);
      const accounts = await api.getAdAccounts();

      return Response.json({
        accounts,
        usingStoredToken: !body?.accessToken,
      });
    } catch (error: any) {
      console.error("Meta API Error:", error?.response?.data || error?.message || error);
      return Response.json(
        { error: "Failed to fetch ad accounts. Check your token permissions." },
        { status: 500 }
      );
    }
  },
  {
    roles: ["admin", "operational"], // ajuste se necessário
  }
);
