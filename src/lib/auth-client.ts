import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { twoFactorClient } from "better-auth/client/plugins";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || undefined,
  plugins: [
    organizationClient(),
    twoFactorClient(),
    adminClient(),
  ],
});

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  organization,
  twoFactor,
} = authClient;
