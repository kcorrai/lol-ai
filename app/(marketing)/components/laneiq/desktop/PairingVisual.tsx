import { Check, Laptop, MonitorDown } from "lucide-react";
import { Chip, Illustration } from "./chrome";

/**
 * Pairing, in the three states a player actually passes through.
 *
 * The code is eight characters from an alphabet with no `0`, `O`, `1` or `I` in it, printed
 * in two groups of four — `src/domains/desktop/codeFormat.ts`, and the grouping is there
 * because eight unbroken characters is where a reader loses their place. Drawing a code that
 * could not be issued would undo the one thing this picture is for, which is showing that
 * there is nothing to type but this.
 *
 * The middle frame names a machine and asks. That is the real screen
 * (`app/(app)/settings/desktop/approve/PageClient.tsx`) and its wording is deliberate: a
 * hostname is not an identity, so the page puts the judgement on the player rather than
 * implying it checked something.
 */

interface Step {
  n: string;
  icon: React.ElementType;
  where: string;
  title: string;
  body: string;
  panel: React.ReactNode;
}

function Screen({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="notch mt-3.5 grid min-h-[104px] place-items-center border border-line-1 bg-ink-1000 p-4">
      {children}
    </div>
  );
}

const STEPS: readonly Step[] = [
  {
    n: "01",
    icon: MonitorDown,
    where: "In the app",
    title: "Press one button",
    body: "The window asks the website to open a pairing request and sends your browser to the page that approves it.",
    panel: (
      <p className="font-mono text-[22px] font-bold tracking-[0.22em] text-accent">7KQD-M4XW</p>
    ),
  },
  {
    n: "02",
    icon: Laptop,
    where: "In the browser",
    title: "Approve the machine",
    body: "The page names the computer asking. Approve it only if it is the one you just pressed the button on.",
    panel: (
      <div className="w-full text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-faint">
          Approve this machine?
        </p>
        <p className="mt-1.5 font-display text-[14px] font-bold uppercase tracking-[0.05em] text-text">
          KAAN-DESKTOP
        </p>
        <span className="tag-cut mt-3 inline-flex h-7 items-center bg-accent px-4 font-display text-[10px] font-bold uppercase tracking-[0.1em] text-background">
          Approve
        </span>
      </div>
    ),
  },
  {
    n: "03",
    icon: Check,
    where: "Back in the app",
    title: "That is the whole of it",
    body: "The window fills in about two seconds later. Your password never enters the application — the machine holds a token of its own, in your operating system's credential store.",
    panel: (
      <div className="grid gap-2 text-center">
        <Chip tone="accent">Paired</Chip>
        <p className="text-[11px] text-text-muted">Kayjay#EUW</p>
      </div>
    ),
  },
];

export function PairingVisual(): React.ReactElement {
  return (
    <Illustration
      label="Pairing in three steps: the app shows an eight-character code, the browser asks whether to approve a machine by name, and the app comes back paired."
      caption="// Illustration — the pairing screens, drawn"
    >
      <div className="grid gap-3.5 lg:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.n} className="notch border border-border bg-surface p-5">
            <div className="flex items-center gap-2.5">
              <step.icon className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.75} />
              <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-text-faint">
                {step.n} · {step.where}
              </span>
            </div>
            <Screen>{step.panel}</Screen>
            <p className="mt-3.5 font-display text-[14px] font-extrabold uppercase tracking-[0.05em] text-text">
              {step.title}
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-text-muted">{step.body}</p>
          </div>
        ))}
      </div>
    </Illustration>
  );
}
