
import GoogleProviderAuth from "next-auth/providers/google";
import { AuthService } from "@/services/auth";
import { ENV } from "@/env";

export const GoogleProvider = GoogleProviderAuth({
  clientId: ENV.AUTH_GOOGLE_ID,
  clientSecret: ENV.AUTH_GOOGLE_SECRET,
  profile: async (profile: any) => {
    const { user } = await AuthService.getUserByEmail(profile.email);

    return {
      ...profile,
      role: user?.role || "user",
      _id: user?._id || "",
    };
  },
});