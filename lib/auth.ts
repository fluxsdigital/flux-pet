import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth/minimal";

import { db } from "@/lib/db";
import { getTrustedOrigins } from "@/lib/auth-origins";

export const auth = betterAuth({
  appName: "Flux Pet",
  trustedOrigins: (request) => getTrustedOrigins(request),
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  rateLimit: {
    enabled: process.env.NODE_ENV === "production",
    customRules: {
      "/sign-in/email": { window: 60, max: 20 },
    },
  },
  advanced: {
    database: { joins: true },
  },
});
