"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// From `src/lib/`, not from the riot domain's `index.ts`. That barrel pulls in
// the Riot API client, whose logger reaches for `async_hooks` — importing it
// from a client component drags server-only code into the browser bundle and
// the page 500s. This module is a plain list with no imports of its own.
import { REGIONS } from "@/lib/riot/regions";
// Straight at `policy`, not at the domain's `index.ts`. That barrel also
// exports the services, which import Prisma, so a *value* taken through it from
// a client component ships the database client to the browser. Type imports
// below are erased at compile time and are safe either way.
import { MIN_BIO_LENGTH } from "@/domains/marketplace/policy";
import type { CoachProfileInput, OwnCoachProfile } from "@/domains/marketplace";
import { ChipSelect } from "@/domains/marketplace/components/ChipSelect";
import { LANGUAGE_OPTIONS, ROLE_OPTIONS } from "@/domains/marketplace/components/options";

const schema = z.object({
  displayName: z.string().min(2, "At least 2 characters").max(48),
  headline: z.string().min(4, "One line about what you coach").max(120),
  bio: z.string().min(MIN_BIO_LENGTH, `At least ${MIN_BIO_LENGTH} characters`).max(4000),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  profile: OwnCoachProfile | null;
  saving: boolean;
  onSave: (input: CoachProfileInput) => Promise<void>;
}

export function CoachApplicationForm({ profile, saving, onSave }: Props): React.ReactElement {
  // The chip fields sit outside react-hook-form: they are arrays edited by
  // toggle rather than typed into, and registering them would mean mirroring
  // every toggle back through `setValue` for nothing.
  const [languages, setLanguages] = useState<string[]>(profile?.languages ?? []);
  const [regions, setRegions] = useState<string[]>(profile?.regions ?? []);
  const [roles, setRoles] = useState<string[]>(profile?.roles ?? []);
  const [chipError, setChipError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: profile?.displayName ?? "",
      headline: profile?.headline ?? "",
      bio: profile?.bio ?? "",
    },
  });

  async function onSubmit(values: FormValues): Promise<void> {
    setChipError(null);
    setServerError(null);

    if (languages.length === 0) return setChipError("Pick at least one language.");
    if (regions.length === 0) return setChipError("Pick at least one region.");
    if (roles.length === 0) return setChipError("Pick at least one role.");

    try {
      await onSave({
        ...values,
        languages,
        regions,
        roles: roles as CoachProfileInput["roles"],
        championIds: profile?.championIds ?? [],
        // Whatever the browser says, which is right far more often than a
        // dropdown the applicant has to find and set correctly.
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Could not save your profile.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your coaching profile</CardTitle>
        <CardDescription>
          {profile?.status === "APPROVED"
            ? "This is what students see. Changes go live as soon as you save them."
            : "This is what students see. Nothing is public until it has been reviewed."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1">
            <label htmlFor="displayName" className="text-sm text-text-muted">
              Display name
            </label>
            <Input id="displayName" placeholder="How students should know you" {...register("displayName")} />
            {errors.displayName && <p className="text-xs text-danger">{errors.displayName.message}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="headline" className="text-sm text-text-muted">
              Headline
            </label>
            <Input id="headline" placeholder="Challenger jungler — macro and pathing" {...register("headline")} />
            {errors.headline && <p className="text-xs text-danger">{errors.headline.message}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="bio" className="text-sm text-text-muted">
              How you coach
            </label>
            <textarea
              id="bio"
              rows={7}
              placeholder="What a session with you is actually like, and who it suits."
              className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register("bio")}
            />
            {errors.bio && <p className="text-xs text-danger">{errors.bio.message}</p>}
          </div>

          <div className="space-y-2">
            <p className="text-sm text-text-muted">Languages you coach in</p>
            <ChipSelect
              aria-label="Languages"
              options={LANGUAGE_OPTIONS}
              selected={languages}
              onChange={setLanguages}
              max={8}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-text-muted">Regions you play on</p>
            <ChipSelect
              aria-label="Regions"
              options={REGIONS.map(({ value, label }) => ({ value, label }))}
              selected={regions}
              onChange={setRegions}
              max={8}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-text-muted">Roles you coach</p>
            <ChipSelect aria-label="Roles" options={ROLE_OPTIONS} selected={roles} onChange={setRoles} />
          </div>

          {chipError && <p className="text-xs text-danger">{chipError}</p>}
          {serverError && (
            <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {serverError}
            </p>
          )}

          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
