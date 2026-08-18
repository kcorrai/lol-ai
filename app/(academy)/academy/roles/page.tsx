import type { Metadata } from "next";
import {
  ROLE_LABEL,
  getLessonStatuses,
  getPlayerRole,
  roleTracksFor,
  trackCompletion,
  type LessonStatus,
} from "@/domains/academy";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
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
    <div className="mx-auto max-w-[1240px] px-5 py-10 md:px-8 md:py-14">
      <Breadcrumb
        items={[
          { name: "Academy", href: "/academy" },
          { name: "Role Paths", href: "/academy/roles" },
        ]}
      />

      <header className="mt-4 max-w-2xl">
        <p className="hud-label text-accent">Five roles, five paths</p>
        <h1 className="mt-2 font-display text-3xl font-black uppercase leading-[1.05] tracking-[0.01em] text-text md:text-4xl">
          The half of the game
          <br />
          only your role plays
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-text-body">
          Wave management, vision and teamfighting are the same job in every role, and the main
          curriculum teaches them once. These five paths cover what is left: the decisions that
          only exist because of where you stand at fourteen minutes.
        </p>
        {role && (
          <p className="mt-3 font-mono text-[11px] uppercase tracking-label text-accent">
            Your ranked games are mostly {ROLE_LABEL[role]} — that path is first
          </p>
        )}
      </header>

      <div className="mt-9 grid gap-4 md:grid-cols-2">
        {tracks.map((track) => (
          <TrackCard
            key={track.id}
            track={track}
            statuses={statuses}
            completion={trackCompletion(track, statuses)}
            yours={track.role === role}
          />
        ))}
      </div>
    </div>
  );
}
