"use client";

import { Zap, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OtpPowerSpike } from "../types/otp.types";

interface OtpTipsProps {
  powerSpikes: OtpPowerSpike[];
  laneStrategies: string[];
  hiddenMechanics: string[];
  isPro: boolean;
}

export function OtpTips({ powerSpikes, laneStrategies, hiddenMechanics, isPro }: OtpTipsProps) {
  return (
    <div className="space-y-4">
      {/* Power spikes */}
      <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
        <h3 className="text-sm font-semibold text-text">Power Spikes</h3>
        <div className="space-y-2">
          {powerSpikes.map((spike, i) => (
            <div key={i} className="flex items-start gap-2">
              <Zap className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <div>
                <span className="text-sm font-medium text-text">{spike.trigger}</span>
                <span className="mx-1.5 text-text-muted">→</span>
                <span className="text-sm text-text-muted">{spike.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lane strategies */}
      <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
        <h3 className="text-sm font-semibold text-text">Lane Strategies</h3>
        <ul className="space-y-1.5">
          {laneStrategies.map((strategy, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              {strategy}
            </li>
          ))}
        </ul>
      </div>

      {/* Hidden mechanics */}
      <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-text">Hidden Mechanics</h3>
          {!isPro && (
            <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
              PRO
            </span>
          )}
        </div>
        <ul className="space-y-1.5">
          {hiddenMechanics.map((mechanic, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              {mechanic}
            </li>
          ))}
        </ul>
        {!isPro && (
          <div className="mt-2 rounded-lg border border-border bg-surface-2 p-4 text-center">
            <Lock className="mx-auto mb-2 h-5 w-5 text-text-muted" />
            <p className="mb-3 text-sm text-text-muted">
              Upgrade to Pro to see all hidden mechanics
            </p>
            <Button size="sm" variant="default" asChild>
              <a href="/pricing">Upgrade to Pro →</a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
