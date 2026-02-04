import { ENV } from "@/env";
import { getSession } from "@/auth";
import axios from "axios";
import { redirect } from "next/navigation";
import { User } from "@/models/identity/user/model";
import { addDays } from "date-fns";

export const GET = async (req: Request) => {
  const session = await getSession();
  if (!session?.user?._id) {
    return Response.redirect(`${ENV.NEXT_PUBLIC_APP_URL}/auth?error=unauthorized`);
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // This is our clientId
  const error = searchParams.get("error");

  if (error || !code || !state) {
    console.error("Meta Auth Error:", error);
    return Response.redirect(`${ENV.NEXT_PUBLIC_APP_URL}/dashboard?error=meta_auth_failed`);
  }

  const clientId = state;
  const redirectUri = `${ENV.NEXT_PUBLIC_APP_URL}/api/auth/meta/callback`;

  try {
    // 1. Exchange Code for Short-Lived Token
    const tokenRes = await axios.get("https://graph.facebook.com/v19.0/oauth/access_token", {
      params: {
        client_id: ENV.META_APP_ID,
        client_secret: ENV.META_APP_SECRET,
        redirect_uri: redirectUri,
        code,
      },
    });

    const shortLivedToken = tokenRes.data.access_token;

    // 2. Exchange Short-Lived for Long-Lived Token (60 days)
    const longTokenRes = await axios.get("https://graph.facebook.com/v19.0/oauth/access_token", {
      params: {
        grant_type: "fb_exchange_token",
        client_id: ENV.META_APP_ID,
        client_secret: ENV.META_APP_SECRET,
        fb_exchange_token: shortLivedToken,
      },
    });

    const longLivedToken = longTokenRes.data.access_token;
    const expiresIn = longTokenRes.data.expires_in; // seconds

    // 3. Save Token to User Profile
    await User.findByIdAndUpdate(session.user._id, {
      metaAccessToken: longLivedToken,
      metaTokenExpiresAt: expiresIn ? addDays(new Date(), 60) : null,
    });


    // 4. Redirect back to client dashboard
    // We pass a flag "action=connect_meta" so the frontend knows to open the modal
    // But we DON'T need to pass the token in URL anymore, safer!
    return Response.redirect(
      `${ENV.NEXT_PUBLIC_APP_URL}/dashboard/clients/${clientId}?action=connect_meta&status=success`
    );

  } catch (err: any) {
    console.error("Meta Token Exchange Error:", err.response?.data || err.message);
    return Response.redirect(`${ENV.NEXT_PUBLIC_APP_URL}/dashboard/clients/${clientId}?error=meta_exchange_failed`);
  }
};
