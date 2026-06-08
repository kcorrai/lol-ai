import { DefaultSession } from "next-auth";

// Augment NextAuth session to expose user.id and emailVerified in session.user
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      emailVerified: Date | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    emailVerified: Date | null;
  }
}

export type AuthUser = {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
};

export type SessionStatus = "loading" | "authenticated" | "unauthenticated";
