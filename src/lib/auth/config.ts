import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { recordFailedAttempt, clearFailedAttempts } from "@/lib/security/bruteForce";
import { getSessionVersion } from "@/lib/auth/sessionVersion";
import { normalizeEmail } from "@/lib/security/email";
import "@/types/auth.types";

// A real bcrypt hash of a value nobody can supply. Only ever used to spend the same
// time on a missing account as on a present one.
const ABSENT_ACCOUNT_HASH = "$2a$12$C6UzMDM.H6dfI/f/IKcEe.7Ee3l9y1lQ3TCkyz0h1qhX6kPFVvHNu";

/**
 * Whether this sign-in still owes a second factor.
 *
 * The challenge endpoint records `profileSettings.totpVerifiedAt` when it passes.
 * Anything stamped before this session began belongs to an earlier login, so it is
 * ignored — otherwise one challenge answered last week would satisfy every future
 * login on the account.
 */
async function isTwoFactorStillPending(userId: string, loginAt: number): Promise<boolean> {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { totpEnabled: true, profileSettings: true },
  });
  if (!dbUser?.totpEnabled) return false;

  const settings = dbUser.profileSettings as Record<string, unknown> | null;
  const stamp = typeof settings?.totpVerifiedAt === "string" ? settings.totpVerifiedAt : null;
  if (!stamp) return true;

  const verifiedAt = Date.parse(stamp);
  return !Number.isFinite(verifiedAt) || verifiedAt < loginAt;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  secret: process.env.AUTH_SECRET,

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    // Google OAuth — only enabled when env vars are present
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Addresses are stored lower-cased (see registrationService). Looking up the
        // raw input made the login case-sensitive while the lockout counter was not,
        // so "Player@x.com" could never sign in to the account it had created.
        const identifier = normalizeEmail(credentials.email);

        try {
          await recordFailedAttempt(identifier);
        } catch {
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email: identifier } });

        // Password hash is stored in Account.access_token for credentials provider
        // See ADR-003 for the reasoning behind this design
        const credentialsAccount = user
          ? await prisma.account.findFirst({
              where: { userId: user.id, provider: "credentials" },
            })
          : null;

        // Compared against a fixed decoy hash when the account does not exist, so an
        // unknown address costs the same as a known one. Skipping bcrypt on the miss
        // made the two answer at visibly different speeds, which is a working account
        // oracle for anyone with a stopwatch.
        const passwordValid = await bcrypt.compare(
          credentials.password,
          credentialsAccount?.access_token ?? ABSENT_ACCOUNT_HASH
        );
        if (!user || !credentialsAccount?.access_token || !passwordValid) return null;

        await clearFailedAttempts(identifier);
        return user;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        // Stamped once per sign-in. `totpVerifiedAt` is compared against it, so a
        // challenge answered during an earlier session cannot vouch for this one.
        token.loginAt = Date.now();
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { emailVerified: true, sessionVersion: true, totpEnabled: true },
        });
        token.emailVerified = dbUser?.emailVerified ?? null;
        token.sessionVersion = dbUser?.sessionVersion ?? 0;
        // A correct password is not a completed login when a second factor is on.
        token.twoFactorPending = dbUser?.totpEnabled === true;
      }
      // Re-fetch after explicit session update (e.g., post email verification, session revocation)
      if (trigger === "update" && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { emailVerified: true, sessionVersion: true },
        });
        token.emailVerified = dbUser?.emailVerified ?? null;
        token.sessionVersion = dbUser?.sessionVersion ?? 0;
      }
      // Validate sessionVersion to support "sign out all devices".
      //
      // Read through Redis rather than straight from Postgres: this ran on every one of the
      // 131 routes behind withAuth and on every render of the (app) layout, which made it the
      // one database call an authenticated request could not avoid. Both revocation paths
      // write the new version through, so a revocation still lands on the next request —
      // `sessionVersion.ts` sets out the window and why it is where it is.
      if (token.id && token.sessionVersion !== undefined) {
        const current = await getSessionVersion(token.id as string);
        // If the stored version is ahead of the token's version, this session was revoked
        if (current !== null && current > (token.sessionVersion as number)) {
          return null as never;
        }
      }
      // Resolved from the database on every read rather than only when the client
      // asks for an update, so an API call cannot be served off a cookie that still
      // claims the challenge is outstanding — or, worse, that it is not.
      if (token.id && token.twoFactorPending) {
        token.twoFactorPending = await isTwoFactorStillPending(
          token.id as string,
          token.loginAt ?? 0
        );
      }
      return token;
    },
    session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          emailVerified: token.emailVerified,
          twoFactorPending: token.twoFactorPending === true,
        },
      };
    },
  },

  events: {
    // Auto-create Profile and Subscription when a user is first created via OAuth
    async createUser({ user }) {
      await prisma.profile.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id },
      });
      await prisma.subscription.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id },
      });
    },

    // Track active sessions for the session management UI
    async signIn({ user }) {
      await prisma.userSession
        .create({
          data: {
            userId: user.id,
            // userAgent and ip are available in the request, but events don't
            // receive the request object. Sessions are enriched on first API call
            // via the /api/sessions/touch endpoint.
          },
        })
        .catch(() => {
          /* non-critical */
        });
    },
  },
};
