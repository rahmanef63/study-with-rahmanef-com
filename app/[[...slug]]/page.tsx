import { OsRoot } from "@/features/os-shell";

// Full-desktop: the OS owns every route. appshell mirrors the focused app to the
// URL via the History API and reads window.location on the client, so this
// catch-all renders the same desktop for ANY path (no dynamic params access —
// stays statically prerenderable under Cache Components). Next serves
// /_next/* and the app-root assets (icon/opengraph) via more-specific handlers,
// so they never reach here.
export default function OsCatchAll() {
  return (
    <div className="h-dvh w-screen overflow-hidden">
      <OsRoot />
    </div>
  );
}
