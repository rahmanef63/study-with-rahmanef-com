"use client";
// resources slice — SuggestionBoxView. Open suggestions + submit form, plus a
// "Usulan saya" tab so a member tracks their own (any status). For instructor+
// (canModerate), each open card gets triage controls. The integrator mounts
// this at /t/[slug]/usulan with canModerate = viewer is instructor+.
//
// Security note: canModerate is UX only — setStatus re-checks instructor+
// server-side; a member who forces it still gets NOT_AUTHORIZED.
import { MessagesSquare, UserRound } from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionHeader, StatTile } from "@/components/mockup-kit";
import { SuggestionList } from "../components/suggestion-list";
import { SuggestionStatusActions } from "../components/suggestion-status-actions";
import { SuggestionSubmitForm } from "../components/suggestion-submit-form";
import { mergeResourcesCopy, type ResourcesCopyOverride } from "../config/copy";
import { useMySuggestions, useOpenSuggestions } from "../hooks/use-suggestions";
import {
  useSetSuggestionStatus,
  useSubmitSuggestion,
} from "../hooks/use-suggestion-mutations";

export type SuggestionBoxViewProps = {
  tenantId: Id<"tenants">;
  /** Viewer is instructor+ — shows per-card triage controls. UX only. */
  canModerate?: boolean;
  copy?: ResourcesCopyOverride;
  className?: string;
};

export function SuggestionBoxView({
  tenantId,
  canModerate = false,
  copy: copyOverride,
  className,
}: SuggestionBoxViewProps) {
  const copy = mergeResourcesCopy(copyOverride);
  const open = useOpenSuggestions(tenantId);
  const mine = useMySuggestions(tenantId);
  const { submit, isPending: submitting } = useSubmitSuggestion(copyOverride);
  const { setStatus, isPending: updating } = useSetSuggestionStatus(copyOverride);

  const openCount = open?.length;
  const mineCount = mine?.length;

  return (
    <div className={className ? `space-y-8 ${className}` : "space-y-8"}>
      <div className="space-y-5">
        <SectionHeader eyebrow="Suara komunitas" title={copy.boxTitle} />
        <p className="max-w-2xl text-pretty text-sm text-muted-foreground @sm:text-base">
          {copy.boxSubtitle}
        </p>
        <div className="grid gap-3 @sm:grid-cols-2">
          <StatTile
            icon={<MessagesSquare className="size-5" aria-hidden />}
            label={copy.tabOpen}
            value={openCount ?? "—"}
          />
          <StatTile
            icon={<UserRound className="size-5" aria-hidden />}
            label={copy.tabMineSuggestion}
            value={mineCount ?? "—"}
          />
        </div>
      </div>

      <Card id="usulkan-topik" className="scroll-mt-24 rounded-[var(--radius-win)]">
        <CardHeader>
          <CardTitle className="text-lg">{copy.submitSuggestionTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <SuggestionSubmitForm
            onSubmit={(v) => submit({ tenantId, ...v })}
            submitting={submitting}
            copy={copy}
          />
        </CardContent>
      </Card>

      <Tabs defaultValue="open">
        <TabsList>
          <TabsTrigger value="open">{copy.tabOpen}</TabsTrigger>
          <TabsTrigger value="mine">{copy.tabMineSuggestion}</TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="pt-4">
          <SuggestionList
            items={open}
            emptyLabel={copy.emptyOpen}
            copy={copy}
            renderActions={
              canModerate
                ? (s) => (
                    <SuggestionStatusActions
                      current={s.status}
                      onSet={(status) => setStatus(s._id, status)}
                      pending={updating}
                      copy={copy}
                    />
                  )
                : undefined
            }
          />
        </TabsContent>

        <TabsContent value="mine" className="pt-4">
          <SuggestionList items={mine} emptyLabel={copy.emptyMineSuggestion} copy={copy} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
