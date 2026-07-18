"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, ClipboardList, MessageCircle, Shield, Swords, X, ArrowRight } from "lucide-react";
import { DemoVideo } from "@/components/ui/DemoVideo";

const STORAGE_KEY = "lolai_onboarding_v1";

const SLIDES = [
  {
    title: "Welcome to LoL AI Coach \u{1F44B}",
    body: "Your personal coach analyzes your real ranked games — not generic Bronze advice. Let's get you going in about 30 seconds.",
  },
  {
    title: "Honest, specific feedback",
    body: "Every report breaks down your strengths, weaknesses and a step-by-step plan to climb — built from your own matches.",
  },
];

const ACTIONS = [
  { icon: ClipboardList, title: "Get your first AI report", desc: "A session review of your recent ranked games.", href: "/coaching" },
  { icon: MessageCircle, title: "Ask your AI coach", desc: "Chat about any matchup or mistake, backed by your data.", href: "/coaching/chat" },
  { icon: Shield, title: "See your champion pool", desc: "Win rates, mastery and what to bench.", href: "/champion-pool" },
  { icon: Swords, title: "Explore the free tools", desc: "Counters, matchups, draft & tier lists.", href: "/tools" },
];

export function DashboardOnboarding() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true);
    } catch {
      /* localStorage unavailable — skip onboarding */
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch { /* ignore */ }
    setOpen(false);
  }

  function go(href: string) {
    dismiss();
    router.push(href);
  }

  if (!open) return null;

  const onActions = step >= SLIDES.length;
  const totalDots = SLIDES.length + 1;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
      >
        <button onClick={dismiss} aria-label="Close" className="absolute right-3 top-3 z-10 rounded-md p-1.5 text-text-muted/70 transition-colors hover:text-text">
          <X className="h-4 w-4" />
        </button>

        {/* Welcome slide leads with the product walkthrough video; later slides keep the accent band */}
        {step === 0 ? (
          <div className="relative overflow-hidden border-b border-border bg-background">
            <DemoVideo className="aspect-video w-full" />
          </div>
        ) : (
          <div className="relative flex h-24 items-center justify-center overflow-hidden bg-gradient-to-br from-accent/20 via-accent/5 to-transparent">
            <motion.span
              animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent ring-1 ring-accent/30"
            >
              <Sparkles className="h-6 w-6" />
            </motion.span>
          </div>
        )}

        <div className="p-6">
          <AnimatePresence mode="wait">
            {!onActions ? (
              <motion.div key={`slide-${step}`} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.3 }}>
                <h2 className="font-display text-2xl font-bold text-text">{SLIDES[step].title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">{SLIDES[step].body}</p>
              </motion.div>
            ) : (
              <motion.div key="actions" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.3 }}>
                <h2 className="font-display text-xl font-bold text-text">Try one to get started</h2>
                <div className="mt-4 grid gap-2">
                  {ACTIONS.map(({ icon: Icon, title, desc, href }) => (
                    <button key={href} onClick={() => go(href)} className="group flex items-center gap-3 rounded-xl border border-border bg-background p-3 text-left transition-colors hover:border-accent/40">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-text">{title}</span>
                        <span className="block text-xs text-text-muted">{desc}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-text-muted transition-colors group-hover:text-accent" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex gap-1.5">
              {Array.from({ length: totalDots }).map((_, i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all ${i === Math.min(step, totalDots - 1) ? "w-5 bg-accent" : "w-1.5 bg-surface-2"}`} />
              ))}
            </div>
            {!onActions ? (
              <button onClick={() => setStep((s) => s + 1)} className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90">
                Next <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={dismiss} className="text-sm text-text-muted transition-colors hover:text-text">
                I&apos;ll explore on my own
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
