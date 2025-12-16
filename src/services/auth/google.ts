
import GoogleProviderAuth from "next-auth/providers/google";
import { AuthService } from "@/services/auth";
import { ENV_SERVER } from "@/env.server";

export const GoogleProvider = GoogleProviderAuth({
  clientId: ENV_SERVER.AUTH_GOOGLE_ID,
  clientSecret: ENV_SERVER.AUTH_GOOGLE_SECRET,
  profile: async (profile: any) => {
    const { user } = await AuthService.getUserByEmail(profile.email);

    return {
      ...profile,
      role: user?.role || "user",
      _id: user?._id || "",
    };
  },
});