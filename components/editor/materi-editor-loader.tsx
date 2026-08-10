"use client";

// THE CODE-SPLIT BOUNDARY. Everything the block editor drags in — the notion
// slice, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities — is reachable
// only through this `next/dynamic` call, so the bundler puts all of it in a
// chunk that NOTHING on a reader route imports. A learner opening
// /k/<t>/materi/<slug> or a lesson inside a course downloads none of it.
//
// `ssr: false` is required, not a preference:
//   · this is instructor-only UI behind a Convex query that is anonymous on the
//     server (tokens live in localStorage; proxy.ts is a stub), so a server
//     render could only ever produce the "not permitted" branch, and
//   · rendering it on the server would put the editor in the SSR graph, which
//     is exactly the download we are avoiding.
//
// `ssr: false` inside next/dynamic is only legal in a Client Component — which
// is why this thin file exists instead of the page importing dynamic() itself.

import dynamic from "next/dynamic";
import type { Id } from "@convex/_generated/dataModel";

const MateriEditor = dynamic(
  () => import("./materi-editor").then((m) => m.MateriEditor),
  {
    ssr: false,
    loading: () => <p className="p-6 text-sm text-muted-foreground">Memuat editor…</p>,
  },
);

export function MateriEditorLoader({ lessonId }: { lessonId: string }) {
  return <MateriEditor lessonId={lessonId as Id<"lessons">} />;
}
