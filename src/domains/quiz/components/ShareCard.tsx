"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Download, ImageIcon, Share2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { buildShareGrid, shareCardParams, type ModeResult } from "@/domains/quiz";

interface ShareCardProps {
  puzzleNumber: number;
  /** Every mode played today, so the card is a day's scorecard not one row. */
  results: ModeResult[];
  streak: number;
}

type Action = "image" | "download" | "text" | "native";

/**
 * The end of a day, as a picture.
 *
 * The card is drawn by `/api/quiz/share` rather than rebuilt here in CSS, so what
 * is on screen is the exact file that gets posted — one design, no drift between
 * the page and the export. The pasted emoji block is still a click away for
 * Discord, which renders text better than it renders an upload.
 */
export function ShareCard({ puzzleNumber, results, streak }: ShareCardProps): React.JSX.Element {
  const [done, setDone] = useState<Action | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [canShareFiles, setCanShareFiles] = useState(false);

  const query = shareCardParams({ puzzleNumber, results, streak });
  const src = `/api/quiz/share?${query}`;
  const text = buildShareGrid({ puzzleNumber, results, streak });
  const fileName = `laneiq-daily-${puzzleNumber}.png`;

  // Probed after mount rather than during render: the answer differs between the
  // server and the phone the page lands on.
  useEffect(() => {
    const probe = new File([new Blob()], fileName, { type: "image/png" });
    setCanShareFiles(
      typeof navigator.canShare === "function" && navigator.canShare({ files: [probe] })
    );
  }, [fileName]);

  function flash(action: Action): void {
    setDone(action);
    setTimeout(() => setDone(null), 2000);
  }

  async function card(): Promise<File> {
    const response = await fetch(src);
    return new File([await response.blob()], fileName, { type: "image/png" });
  }

  async function copyImage(): Promise<void> {
    try {
      const file = await card();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": file })]);
      flash("image");
    } catch {
      // Firefox and every embedded browser refuse image writes; the card is still
      // one click away as a file, which is what the player wanted anyway.
      await download();
    }
  }

  async function download(): Promise<void> {
    const url = URL.createObjectURL(await card());
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    flash("download");
  }

  async function copyText(): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      flash("text");
    } catch {
      // The block is on screen under "text version" — nothing to recover.
    }
  }

  async function share(): Promise<void> {
    try {
      await navigator.share({ files: [await card()], text: `LaneIQ Daily #${puzzleNumber}` });
      flash("native");
    } catch {
      // A cancelled share sheet throws too. Nothing to say about it.
    }
  }

  return (
    <div className="grid gap-5 sm:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
      <div className="notch relative overflow-hidden border border-line-2 bg-surface-dark">
        {!loaded && <Skeleton className="absolute inset-0 h-full w-full" />}
        {/* eslint-disable-next-line @next/next/no-img-element -- a generated PNG
            with no fixed intrinsic size in the build; next/image adds nothing */}
        <img
          src={src}
          alt={`LaneIQ Daily #${puzzleNumber} scorecard: ${text.split("\n").slice(1).join(", ")}`}
          className={`block w-full transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
        />
      </div>

      <div className="grid max-w-[440px] content-start gap-3">
        <div>
          <p className="font-display text-[16px] font-extrabold uppercase tracking-wide text-fg-1">
            Your day, as a card
          </p>
          <p className="mt-1.5 font-mono text-[11.5px] leading-relaxed text-fg-3">
            Every mode you opened, how many guesses each one took, and the streak riding on it — in
            one picture, with no champion on it.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button onClick={() => void copyImage()} primary done={done === "image"} icon={ImageIcon}>
            Copy image
          </Button>
          <Button onClick={() => void download()} done={done === "download"} icon={Download}>
            Download
          </Button>
          <Button onClick={() => void copyText()} done={done === "text"} icon={Copy}>
            Copy text
          </Button>
          {canShareFiles && (
            <Button onClick={() => void share()} done={done === "native"} icon={Share2}>
              Share
            </Button>
          )}
        </div>

        <details className="group">
          <summary className="tag-cut w-fit cursor-pointer list-none border border-line-2 px-2.5 py-1 font-mono text-[10px] uppercase tracking-label text-fg-3 hover:border-accent hover:text-accent">
            Text version for Discord
          </summary>
          <pre className="tag-cut mt-2 overflow-x-auto whitespace-pre border border-line-2 bg-surface-dark p-3 font-mono text-[11.5px] leading-relaxed text-fg-2">
            {text}
          </pre>
        </details>

        <p className="font-mono text-[10px] uppercase tracking-label text-fg-4">
          Names no champion — safe to post before your friends have played
        </p>
      </div>
    </div>
  );
}

function Button({
  onClick,
  done,
  primary,
  icon: Icon,
  children,
}: {
  onClick: () => void;
  done: boolean;
  primary?: boolean;
  icon: typeof Copy;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`tag-cut flex items-center justify-center gap-2 border px-3.5 py-2 font-mono text-[11px] uppercase tracking-label transition-colors ${
        primary
          ? "btn-glow border-accent bg-accent font-bold text-ink-1000 hover:bg-acid-400"
          : "border-line-2 bg-surface-2 text-fg-1 hover:border-accent hover:text-accent"
      }`}
    >
      {done ? (
        <Check aria-hidden className="h-3.5 w-3.5" />
      ) : (
        <Icon aria-hidden className="h-3.5 w-3.5" />
      )}
      {done ? "Done" : children}
    </button>
  );
}
