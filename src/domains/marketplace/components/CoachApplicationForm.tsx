"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { HudPanel } from "@/domains/marketplace/components/hud/HudPanel";

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
    watch,
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

  const bio = watch("bio") ?? "";
  const bioOk = bio.trim().length >= MIN_BIO_LENGTH;

  return (
    <HudPanel
      label="Step 2 · Your profile"
      padded={false}
      action={
        <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-text-faint">
          {profile?.status === "APPROVED"
            ? "Changes go live as soon as you save them"
            : "Nothing is public until it has been reviewed"}
        </span>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 p-5">
        <Field
          label="Display name"
          hint="How students should know you."
          error={errors.displayName?.message}
        >
          <Input id="displayName" placeholder="Mert 'Vergil' Kaya" {...register("displayName")} />
        </Field>

        <Field
          label="Headline"
          hint="One line. Role, rank and the thing you fix."
          error={errors.headline?.message}
        >
          <Input
            id="headline"
            placeholder="Master mid laner — roaming and wave control"
            {...register("headline")}
          />
        </Field>

        <div className="grid gap-2">
          <label
            htmlFor="bio"
            className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-text-muted"
          >
            How you coach
          </label>
          <textarea
            id="bio"
            rows={5}
            placeholder="What a session with you is actually like, and who it suits. Reviewers read this more closely than anything else."
            className="well w-full resize-y border border-line-2 bg-background px-3 py-2.5 text-sm leading-relaxed text-text placeholder:text-text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...register("bio")}
          />
          <div className="flex items-center justify-between gap-3">
            <span
              className={`font-mono text-[9px] uppercase tracking-[0.14em] ${
                bioOk ? "text-accent" : "text-text-faint"
              }`}
            >
              {bioOk
                ? "Good — this is what reviewers read"
                : `At least ${MIN_BIO_LENGTH} characters`}
            </span>
            <span className="font-mono text-[9px] tracking-[0.14em] text-text-faint">
              {bio.trim().length} chars
            </span>
          </div>
          {errors.bio && <p className="text-xs text-danger">{errors.bio.message}</p>}
        </div>

        <ChipGroup label="Roles you coach" count={roles.length}>
          <ChipSelect
            aria-label="Roles"
            options={ROLE_OPTIONS}
            selected={roles}
            onChange={setRoles}
          />
        </ChipGroup>

        <ChipGroup label="Languages you coach in" count={languages.length}>
          <ChipSelect
            aria-label="Languages"
            options={LANGUAGE_OPTIONS}
            selected={languages}
            onChange={setLanguages}
            max={8}
          />
        </ChipGroup>

        <ChipGroup label="Regions you play on" count={regions.length}>
          <ChipSelect
            aria-label="Regions"
            options={REGIONS.map(({ value, label }) => ({ value, label }))}
            selected={regions}
            onChange={setRegions}
            max={8}
          />
        </ChipGroup>

        {chipError && <p className="text-xs text-danger">{chipError}</p>}
        {serverError && (
          <p className="border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {serverError}
          </p>
        )}

        <Button type="submit" disabled={saving} className="justify-self-start">
          {saving ? "Saving…" : "Save profile"}
        </Button>
      </form>
    </HudPanel>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <label className="grid gap-1.5">
      <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-text-muted">
        {label}
      </span>
      {children}
      {error ? (
        <span className="text-xs text-danger">{error}</span>
      ) : (
        hint && <span className="text-[12px] text-text-faint">{hint}</span>
      )}
    </label>
  );
}

function ChipGroup({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div>
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-text-muted">
          {label}
        </span>
        <span
          className={`font-mono text-[9px] uppercase tracking-[0.12em] ${
            count > 0 ? "text-accent" : "text-warning"
          }`}
        >
          {count > 0 ? `${count} selected` : "pick at least one"}
        </span>
      </div>
      {children}
    </div>
  );
}
