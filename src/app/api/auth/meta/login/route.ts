import { ENV } from "@/env";
import { getSession } from "@/auth";
import { redirect } from "next/navigation";

export const GET = async (req: Request) => {
  const session = await getSession();
  if (!session?.user?._id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");

  if (!clientId) {
    return Response.json({ error: "Missing clientId" }, { status: 400 });
  }

  const appId = ENV.META_APP_ID;
  const redirectUri = `${ENV.NEXT_PUBLIC_APP_URL}/api/auth/meta/callback`;
  const scope = "ads_read,ads_management,pages_read_engagement,pages_show_list";
  const state = clientId; // Passando clientId no state para recuperar no callback

  if (!appId) {
    return Response.json({ error: "Meta App ID not configured" }, { status: 500 });
  }

  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${scope}&state=${state}`;

  redirect(authUrl);
};
