import { redirect } from "next/navigation";

// `/coach/apply` is the door somebody without a profile comes through, and the
// profile page is what is behind it — the same form serves the application and
// every edit after it, so there is one page rather than two that drift apart.
// Kept as a route because "become a coach" is the phrase people follow, and a
// link that has been public should keep working.
export default function CoachApplyRedirect() {
  redirect("/coach/profile");
}
