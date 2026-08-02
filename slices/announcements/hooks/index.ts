// announcements slice — hooks sub-barrel (re-exports only), a LIGHT public
// entry beside the full barrel (../index.ts). Eager OS-shell chrome
// (shell-activity's announcement watchers) imports from here so the barrel's
// views never enter the initial JS chunk (see docs/SLICES.md "Light entries").
export { useAnnouncements } from "./use-announcements";
export { useCreateAnnouncement } from "./use-announcement-mutations";
