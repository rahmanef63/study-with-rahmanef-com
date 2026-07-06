"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { QuizTakeView } from "@/features/quiz";

// Member quiz-taking surface. QuizTakeView is member-gated in its query and
// renders a friendly "no quiz" state if the module has none, so the route is
// safe for any moduleId (audit: quiz taking entry was missing end-to-end).
export default function QuizTakePage({
  params,
}: {
  params: Promise<{ slug: string; kelasSlug: string; moduleId: string }>;
}) {
  const { slug, kelasSlug, moduleId } = use(params);
  const backHref = `/t/${slug}/kelas/${kelasSlug}`;
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4 text-muted-foreground">
        <Link href={backHref}>
          <ArrowLeft aria-hidden /> Kembali ke kelas
        </Link>
      </Button>
      <QuizTakeView moduleId={moduleId as Id<"modules">} />
    </div>
  );
}
