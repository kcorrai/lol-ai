import type { Metadata } from "next";
import {
  ROLE_LABEL,
  getLessonStatuses,
  getPlayerRole,
  roleTracksFor,
  trackCompletion,
  type LessonStatus,
} from "@/domains/academy";
import Link from "next/link";
import { AcademyHeader } from "@/domains/academy/components/AcademyHeader";
import { TrackCard } from "@/domains/academy/components/TrackCard";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Role Paths — Top, Jungle, Mid, ADC and Support",
  description:
    "Five short League of Legends courses, one per role: split pushing and teleport for top, clearing and pathing for jungle, roaming for mid, positioning and spacing for ADC, and vision economy for support.",
  alternates: { canonical: "/academy/roles" },
};

export default async function RolePathsPage(): Promise<React.ReactElement> {
  const session = await getSession();
  const userId = session?.user?.id ?? null;

  const [statuses, role] = await Promise.all([
    userId ? getLessonStatuses(userId) : Promise.resolve(new Map<string, LessonStatus>()),
    getPlayerRole(userId),
  ]);

  const tracks = roleTracksFor(role);

  return (
    <div className="pb-12">
      <AcademyHeader
        champion="Ambessa"
        eyebrow={
          <>
            <p className="hud-label text-text-faint">
              <Link href="/academy" className="text-text-muted transition-colors hover:text-accent">
                Academy
              </Link>{" "}
              / Role Paths
            </p>
            <p className="mt-3.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.18em] text-accent">
              {"// Five roles, five paths"}
            </p>
          </>
        }
        title={
          <>
            The half of the game
            <br />
            only your role plays
          </>
        }
        lede="Wave management, vision and teamfighting are the same job in every role, and the main curriculum teaches them once. These five paths cover what is left: the decisions that only exist because of where you stand at fourteen minutes."
      />

      <div className="mx-auto max-w-[1240px] px-5 pt-6 md:px-8">
        {role && (
          <p className="mb-4 font-mono text-[11px] uppercase tracking-label text-accent">
            Your ranked games are mostly {ROLE_LABEL[role]} — that path is first
          </p>
        )}

        <div className="grid gap-3.5 lg:grid-cols-2">
          {tracks.map((track, i) => (
            <TrackCard
              key={track.id}
              track={track}
              statuses={statuses}
              completion={trackCompletion(track, statuses)}
              yours={track.role === role}
              index={i}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
