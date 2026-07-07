"use client";
// OsRoot — mounts the desktop. <AppShell> owns its whole provider stack
// (capabilities/brand/registry/responsive) + window store; it only needs the
// app-level Convex + theme providers, which the root layout already supplies.
// The manifest is a stable module constant, so no memoization is needed.
import { AppShell } from "@/features/appshell";
import { shellManifest } from "./manifest";

export function OsRoot() {
  return <AppShell manifest={shellManifest} />;
}
