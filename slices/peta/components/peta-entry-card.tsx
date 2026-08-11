"use client";
// The community-home invitation, and the rule that governs it: DO NOT NAG.
//
// It hides itself for anyone who has already been answered — three
// independent signals, because the audience is anonymous-first and no single
// one covers everybody:
//   · a finished run in localStorage — the anonymous visitor's own memory;
//   · a saved learnerProfile — the same person on their second device;
//   · any lesson completion — someone already learning does not need to be
//     asked where to start.
// It also stays hidden until all three have answered, so it can never flash in
// and out on a slow connection.
//
// TWO COMPONENTS, and the split is load-bearing. The outer one touches nothing
// but localStorage and renders `null` on the server AND on the first client
// render, so the Convex hooks below do not exist during hydration. Measured on
// /k/belajar-ai: mounting them inline was enough to change hydration timing and
// make the community nav bar lose a pre-existing race between its own loading
// skeleton and JoinButton's (see the report — `community-nav-action.tsx` and
// `join-button.tsx` render DIFFERENT classNames for the same loading state).
// Deferring our subscriptions by one frame keeps this card out of that entirely.
import { useEffect, useState } from "react";
import { useRecentCourses } from "@/features/progress";
import { isComplete } from "@/lib/peta";
import { useSavedPeta } from "../hooks/use-save-peta";
import { loadRun } from "../lib/storage";
import { PetaCallout } from "./peta-callout";

export function PetaEntryCard({ className }: { className?: string }) {
  // localStorage is unreadable during SSR, so this starts as "unknown".
  const [tookIt, setTookIt] = useState<boolean | null>(null);
  useEffect(() => setTookIt(isComplete(loadRun().draft)), []);

  if (tookIt === null || tookIt) return null;
  return <PetaEntryGate className={className} />;
}

/** Post-mount only. Never rendered during hydration — see the note above. */
function PetaEntryGate({ className }: { className?: string }) {
  const recent = useRecentCourses();
  const saved = useSavedPeta();

  if (recent === undefined || saved === undefined) return null;
  if (saved !== null || recent.length > 0) return null;
  return <PetaCallout className={className} />;
}
