import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

// Protect all (app) routes — public routes (marketing, auth) are not listed here
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/matches/:path*",
    "/coaching/:path*",
    "/champions/:path*",
    "/roadmap/:path*",
    "/settings/:path*",
  ],
};
