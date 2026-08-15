import type { Metadata } from "next";
import { HudPanel, HudRule } from "@/components/dashboard/laneiq/HudPanel";
import { CreateDraftForm } from "./CreateDraftForm";

export const metadata: Metadata = {
  title: "Free LoL Draft Tool — Fearless Draft & Series in One Link | LaneIQ",
  description:
    "Run a full tournament pick/ban draft in the browser. Fearless series, per-turn timers, drafter and spectator links, and live pick advice from real patch data. Free, no login.",
  alternates: { canonical: "/draft" },
};

export default function CreateDraftPage(): React.ReactElement {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold text-text">Draft Room</h1>
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-text-body">
          A full tournament pick/ban, run from one link. Set the series up once and it carries the
          fearless lockouts, the score and the side swaps through all five games.
        </p>
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-text-muted">
          While you draft, your side sees what the patch data says about the pick in front of you —
          which champions are actually strong right now, what counters what is already on the board,
          and where your comp is thin.
        </p>
      </header>

      <HudPanel className="p-5">
        <HudRule label="NEW DRAFT" />
        <div className="mt-5">
          <CreateDraftForm />
        </div>
      </HudPanel>
    </div>
  );
}
