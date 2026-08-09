// Seeding entry points. THIS FILE IS THE PUBLIC SURFACE — the `seed:<name>`
// paths below are what the CLI, README and docs/STATUS.md runbook reference, so
// a function may move between _seed/ modules but must keep its name here.
//
// All four are internalMutation: not callable from any client (P0). Run them in
// order, from the repo root:
//
//   npx convex run seed:bootstrap '{
//     "ownerEmail": "rahmanef63@gmail.com",
//     "username": "rahman",
//     "displayName": "Rahman",
//     "tenantSlug": "belajar-ai",
//     "tenantName": "Belajar AI bareng Rahman",
//     "tenantDescription": "Komunitas belajar pengaplikasian AI untuk semua orang."
//   }'
//   npx convex run seed:seedContent    '{"ownerEmail":"…","tenantSlug":"belajar-ai"}'
//   npx convex run seed:seedWorld      '{"ownerEmail":"…"}'
//   npx convex run seed:seedEngagement '{"ownerEmail":"…","tenantSlug":"belajar-ai"}'
//
// Every one is idempotent — re-running keeps existing rows. Add `--prod` to
// target rare-toucan-552.
//
// The implementations live in convex/_seed/: one module per mutation, one file
// per course and per community, and the Bahasa-Indonesia content in its own
// data modules. This file used to hold all of it at 984 LOC — roughly 5x the
// repo's 200-LOC ceiling — and almost all of that was course copy, not logic.
// Splitting content from rules means adding a class is a new file plus one
// array entry, and the seeding rules stay short enough to actually read.
import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { runBootstrap } from "./_seed/bootstrap";
import { runSeedContent } from "./_seed/seedContent";
import { runSeedEngagement } from "./_seed/seedEngagement";
import { runSeedWorld } from "./_seed/seedWorld";

export const bootstrap = internalMutation({
  args: {
    ownerEmail: v.string(),
    username: v.string(),
    displayName: v.string(),
    tenantSlug: v.string(),
    tenantName: v.string(),
    tenantDescription: v.string(),
  },
  handler: (ctx, args) => runBootstrap(ctx, args),
});

export const seedContent = internalMutation({
  args: { ownerEmail: v.string(), tenantSlug: v.string() },
  handler: (ctx, args) => runSeedContent(ctx, args),
});

export const seedWorld = internalMutation({
  args: { ownerEmail: v.string() },
  handler: (ctx, args) => runSeedWorld(ctx, args),
});

export const seedEngagement = internalMutation({
  args: { ownerEmail: v.string(), tenantSlug: v.string() },
  handler: (ctx, args) => runSeedEngagement(ctx, args),
});
