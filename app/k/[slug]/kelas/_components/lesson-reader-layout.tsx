import Link from "next/link";
import { ArrowLeft, List } from "lucide-react";
import type { ReactNode } from "react";

/** Desktop panes share a viewport; narrow screens keep the document scroll. */
export function LessonReaderLayout({
  courseHref,
  syllabus,
  children,
}: {
  courseHref: string;
  syllabus: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="@3xl:grid @3xl:h-[calc(100dvh-4rem)] @3xl:grid-cols-[minmax(15rem,17rem)_minmax(0,1fr)] @3xl:grid-rows-[auto_minmax(0,1fr)] @3xl:gap-x-8 @3xl:gap-y-4">
      <div className="mb-4 @3xl:col-span-2 @3xl:mb-0">
        <Link href={courseHref} className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          <ArrowLeft className="size-4" aria-hidden /> Kembali ke kelas
        </Link>
      </div>
      <aside aria-label="Silabus kelas" className="hidden min-h-0 @3xl:block">
        {syllabus}
      </aside>
      <details className="mb-5 rounded-[var(--radius)] border border-border bg-card @3xl:hidden">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
          <List className="size-4 text-muted-foreground" aria-hidden /> Daftar materi
        </summary>
        <div className="border-t border-border px-4 py-3">{syllabus}</div>
      </details>
      <div role="region" aria-label="Bacaan dan diskusi" tabIndex={0} className="min-h-0 min-w-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring @3xl:overflow-y-auto @3xl:overscroll-contain @3xl:pr-3">
        {children}
      </div>
    </div>
  );
}
