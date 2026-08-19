import { DefaultSession } from "next-auth";

// Augment NextAuth session to expose user.id and emailVerified in session.user
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      emailVerified: Date | null;
      // True between a correct password and a correct second factor. Every
      // authenticated surface has to treat this session as not yet logged in.
      twoFactorPending: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    emailVerified: Date | null;
    // Epoch ms of the sign-in this token came from. The 2FA challenge stamps the
    // user row when it passes; a stamp older than this belongs to a previous
    // login and must not satisfy the current one.
    loginAt?: number;
    twoFactorPending?: boolean;
  }
}

export type AuthUser = {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
};

export type SessionStatus = "loading" | "authenticated" | "unauthenticated";
