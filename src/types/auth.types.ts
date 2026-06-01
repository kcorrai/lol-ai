import { DefaultSession } from "next-auth";

// Augment NextAuth session to expose user.id in session.user
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

export type AuthUser = {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
};

export type SessionStatus = "loading" | "authenticated" | "unauthenticated";
