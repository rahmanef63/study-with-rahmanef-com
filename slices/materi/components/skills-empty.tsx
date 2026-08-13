// materi slice — the skills library's empty state.
//
// This gets its own component because it is not a fallback, it is the LAUNCH
// SCREEN: prompts were deliberately deferred, so the tab ships empty and this
// is the first — for a while, the only — thing anyone will see on it. "Belum
// ada skill" would teach a member nothing about what the tab is for, and would
// teach an instructor nothing about how to fill it.
//
// So it answers the two questions an empty room raises: what was supposed to
// be here, and who puts it there. The second answer is role-aware — a member
// gets told who to expect it from, an instructor gets the door.
import Link from "next/link";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyArt,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { mergeMateriCopy, type MateriCopyOverride } from "../config/copy";

export type SkillsEmptyProps = {
  /** Instructor+ — gets the "how" plus the Kelola link instead of the "who". */
  canManage: boolean;
  /** Built by the caller: a function prop cannot cross the server→client
   *  boundary, so the href arrives as a string like every other one here. */
  kelolaHref: string;
  copy?: MateriCopyOverride;
  /** Overridable by the host; the default is the sprite this app ships. */
  art?: string;
};

export function SkillsEmpty({
  canManage,
  kelolaHref,
  copy: copyOverride,
  art = "/ui/empty/generic.webp",
}: SkillsEmptyProps) {
  const copy = mergeMateriCopy(copyOverride);
  return (
    <Empty className="gap-4 border-2 border-dashed p-5 md:p-8">
      <EmptyHeader className="gap-2">
        <EmptyArt src={art} />
        <EmptyTitle className="font-display text-xs uppercase leading-relaxed">
          {copy.emptySkillsTitle}
        </EmptyTitle>
        {/* WHAT a skill is — the sentence that makes the tab make sense. */}
        <EmptyDescription className="text-pretty">{copy.emptySkillsWhat}</EmptyDescription>
        {/* HOW one gets here, addressed to whoever is reading. */}
        <EmptyDescription className="text-pretty">
          {canManage ? copy.emptySkillsHowInstructor : copy.emptySkillsHow}
        </EmptyDescription>
      </EmptyHeader>
      {canManage ? (
        <Button asChild variant="outline" size="sm" className="min-h-11 @sm:min-h-9">
          <Link href={kelolaHref}>{copy.emptySkillsCta}</Link>
        </Button>
      ) : null}
    </Empty>
  );
}
