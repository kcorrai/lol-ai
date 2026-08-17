import type { Metadata } from "next";
import { CreateDraftForm } from "./CreateDraftForm";
import { DraftEdges } from "./DraftEdges";

export const metadata: Metadata = {
  title: "Free LoL Draft Tool — Fearless Draft & Series in One Link | LaneIQ",
  description:
    "Run a full tournament pick/ban draft in the browser. Fearless series, per-turn timers, drafter and spectator links, and live pick advice from real patch data. Free, no login.",
  alternates: { canonical: "/draft" },
};

export default function CreateDraftPage(): React.ReactElement {
  return (
    <div className="mx-auto max-w-[1240px] px-5 py-8 md:px-8">
      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div>
          <h1 className="m-0 font-display text-4xl font-black uppercase leading-none text-fg-1 md:text-[42px]">
            Draft room
          </h1>
          <p className="mt-3.5 max-w-[52ch] text-[15px] text-fg-2">
            A full tournament pick/ban, run from one link. Set the series up once and it carries the
            fearless lockouts, the score and the side swaps through all five games.
          </p>
          <p className="mt-3 max-w-[52ch] text-[15px] text-fg-3">
            While you draft, your side sees what the patch data says about the pick in front of you —
            which champions are actually strong right now, what counters what is already on the
            board, and where your comp is thin.
          </p>

          <DraftEdges />
        </div>

        <div className="notch bg-hero-fade border border-border bg-surface p-6">
          <div className="mb-5 font-mono text-[10.5px] uppercase tracking-label text-acid-500">
            {"// NEW DRAFT"}
          </div>
          <CreateDraftForm />
        </div>
      </div>
    </div>
  );
}
