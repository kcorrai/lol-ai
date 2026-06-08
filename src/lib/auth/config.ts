import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { recordFailedAttempt, clearFailedAttempts } from "@/lib/security/bruteForce";
import "@/types/auth.types";

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

        const identifier = credentials.email.toLowerCase();

        try {
          await recordFailedAttempt(identifier);
        } catch {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) return null;

        // Password hash is stored in Account.access_token for credentials provider
        // See ADR-003 for the reasoning behind this design
        const credentialsAccount = await prisma.account.findFirst({
          where: { userId: user.id, provider: "credentials" },
        });
        if (!credentialsAccount?.access_token) return null;

        const passwordValid = await bcrypt.compare(
          credentials.password,
          credentialsAccount.access_token
        );
        if (!passwordValid) return null;

        await clearFailedAttempts(identifier);
        return user;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { emailVerified: true, sessionVersion: true },
        });
        token.emailVerified = dbUser?.emailVerified ?? null;
        token.sessionVersion = dbUser?.sessionVersion ?? 0;
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
      // Validate sessionVersion to support "sign out all devices"
      if (token.id && token.sessionVersion !== undefined) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { sessionVersion: true },
        });
        // If the DB version is ahead of the token's version, this session was revoked
        if (dbUser && dbUser.sessionVersion > (token.sessionVersion as number)) {
          return null as never;
        }
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
      await prisma.userSession.create({
        data: {
          userId: user.id,
          // userAgent and ip are available in the request, but events don't
          // receive the request object. Sessions are enriched on first API call
          // via the /api/sessions/touch endpoint.
        },
      }).catch(() => { /* non-critical */ });
    },
  },
};
