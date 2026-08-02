"use client";

// G1 (UI-UX-PRD §3): every signed-in user gets a profile row on first login,
// app-wide — mounted at root boot inside ConvexAuthProvider so it fires no
// matter which surface the user lands on (not just the marketing header).
import { useCurrentProfile, useEnsureProfileOnFirstLogin } from "@/features/profiles";

export function ProfileBootstrap() {
  const { profile, isLoading, isAuthenticated } = useCurrentProfile();
  useEnsureProfileOnFirstLogin(isAuthenticated && !isLoading && profile === null);
  return null;
}
