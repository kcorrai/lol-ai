"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { rememberGoal } from "@/lib/coachMatch/carriedGoal";

/** Picks a `?goal=` off the storefront URL and keeps it for the booking request. Renders nothing. */
export function GoalCarrier(): null {
  const goal = useSearchParams().get("goal");
  useEffect(() => {
    if (goal) rememberGoal(goal);
  }, [goal]);
  return null;
}
