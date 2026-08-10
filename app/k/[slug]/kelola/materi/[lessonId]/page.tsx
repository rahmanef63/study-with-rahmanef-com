import type { Metadata } from "next";
import Link from "next/link";
import { MateriEditorLoader } from "@/components/editor/materi-editor-loader";

// The block editor for one materi. Instructor-only and entirely client-side:
// the server component below renders no Convex read at all, because a server
// component here is permanently ANONYMOUS (tokens live in localStorage) and the
// only query this route needs is instructor-gated. Authorisation is the
// server-side check inside `getLessonForManage` / `saveContent`, not this page.
//
// Which is also why the editor arrives through `MateriEditorLoader` — a
// next/dynamic ssr:false boundary. It keeps the editor and @dnd-kit out of
// every OTHER route's chunk graph; see that file for the full reasoning.
export const metadata: Metadata = { title: "Edit materi", robots: { index: false } };

type Params = { slug: string; lessonId: string };

export default async function EditMateriPage({ params }: { params: Promise<Params> }) {
  const { slug, lessonId } = await params;
  return (
    <div className="@container flex min-h-[70vh] flex-col">
      <nav className="mb-4">
        <Link
          href={`/k/${slug}/kelola`}
          className="text-xs uppercase tracking-wide text-muted-foreground hover:text-foreground"
        >
          ← Kembali ke konsol
        </Link>
      </nav>
      <div className="min-h-0 flex-1 border-2 border-border bg-card shadow-sm">
        {/* A malformed id is rejected by the Convex validator, which surfaces
            as the route error boundary — same as every other id-in-URL route. */}
        <MateriEditorLoader lessonId={lessonId} />
      </div>
    </div>
  );
}
