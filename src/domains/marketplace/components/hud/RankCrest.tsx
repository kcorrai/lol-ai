import Image from "next/image";
import { cn } from "@/lib/utils";
import { rankEmblemUrl } from "@/lib/ddragon";
import { tierLabel } from "@/lib/riot/rankDisplay";
import { tierTint } from "@/domains/marketplace/components/hud/tierTone";

interface RankCrestProps {
  /** Null draws the unranked crest in a neutral glow. */
  tier: string | null | undefined;
  size?: "sm" | "md" | "lg" | "xl";
  /** A stale badge is drawn desaturated, so an unrefreshed rank never looks as sure as a fresh one. */
  dimmed?: boolean;
  className?: string;
}

const PX = { sm: 44, md: 72, lg: 112, xl: 168 } as const;

/**
 * The full-colour ranked crest over a glow in its tier's own colour.
 *
 * The verified rank is the one thing about a coach we can vouch for, so it gets
 * to be the picture — we host no avatars, and the crest is the image the game
 * itself uses to say the same thing.
 */
export function RankCrest({
  tier,
  size = "md",
  dimmed,
  className,
}: RankCrestProps): React.ReactElement {
  const px = PX[size];

  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: px, height: px }}
    >
      <span
        className="absolute inset-[-18%] rounded-full"
        style={{
          background: `radial-gradient(closest-side, ${tierTint(tier, dimmed ? 0.12 : 0.34)}, transparent)`,
        }}
        aria-hidden
      />
      <Image
        src={rankEmblemUrl(tier ?? "unranked")}
        alt={tier ? `${tierLabel(tier)} crest` : "Unranked crest"}
        width={px}
        height={px}
        className={cn(
          "relative h-full w-full object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.55)]",
          dimmed && "opacity-60 grayscale-[0.6]"
        )}
      />
    </span>
  );
}
