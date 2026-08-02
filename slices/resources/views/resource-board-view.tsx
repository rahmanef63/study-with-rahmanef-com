"use client";
// resources slice — ResourceBoardView. Approved grid + submit form + (for
// instructor+) a pending review tab, plus a "Kiriman saya" tab so a submitter
// sees their own pending items. The integrator mounts this at
// /t/[slug]/resources with canModerate = viewer is instructor+.
//
// Security note: `canModerate` only toggles UX — the pending query itself
// requires instructor+ server-side, and curate re-checks the role. A member who
// forces canModerate still gets NOT_AUTHORIZED from Convex.
import { BookMarked, Inbox, Send } from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionHeader, StatTile } from "@/components/mockup-kit";
import { ResourceGrid } from "../components/resource-grid";
import { ResourceReviewList } from "../components/resource-review-list";
import { ResourceSubmitForm } from "../components/resource-submit-form";
import { mergeResourcesCopy, type ResourcesCopyOverride } from "../config/copy";
import {
  useApprovedResources,
  useMyResources,
  usePendingResources,
} from "../hooks/use-resources";
import { useCurateResource, useSubmitResource } from "../hooks/use-resource-mutations";

export type ResourceBoardViewProps = {
  tenantId: Id<"tenants">;
  /** Viewer is instructor+ — shows the pending review tab. UX only. */
  canModerate?: boolean;
  copy?: ResourcesCopyOverride;
  className?: string;
};

export function ResourceBoardView({
  tenantId,
  canModerate = false,
  copy: copyOverride,
  className,
}: ResourceBoardViewProps) {
  const copy = mergeResourcesCopy(copyOverride);
  const approved = useApprovedResources(tenantId);
  const mine = useMyResources(tenantId);
  const pending = usePendingResources(tenantId, canModerate);
  const { submit, isPending: submitting } = useSubmitResource(copyOverride);
  const { curate, isPending: curating } = useCurateResource(copyOverride);

  const pendingCount = pending?.length ?? 0;
  const approvedCount = approved?.length;
  const mineCount = mine?.length;

  return (
    <div className={className ? `space-y-8 ${className}` : "space-y-8"}>
      <div className="space-y-5">
        <SectionHeader eyebrow="Kurasi komunitas" title={copy.boardTitle} />
        <p className="max-w-2xl text-pretty text-sm text-muted-foreground @sm:text-base">
          {copy.boardSubtitle}
        </p>
        <div className="grid gap-3 @sm:grid-cols-2 @lg:grid-cols-3">
          <StatTile
            icon={<BookMarked className="size-5" aria-hidden />}
            label={copy.tabApproved}
            value={approvedCount ?? "—"}
          />
          <StatTile
            icon={<Send className="size-5" aria-hidden />}
            label={copy.tabMine}
            value={mineCount ?? "—"}
          />
          {canModerate ? (
            <StatTile
              icon={<Inbox className="size-5" aria-hidden />}
              label={copy.tabPending}
              value={pendingCount}
            />
          ) : null}
        </div>
      </div>

      <Card id="bagikan-sumber" className="scroll-mt-24 rounded-[var(--radius-win)]">
        <CardHeader>
          <CardTitle className="text-lg">{copy.submitResourceTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResourceSubmitForm
            onSubmit={(v) => submit({ tenantId, ...v })}
            submitting={submitting}
            copy={copy}
          />
        </CardContent>
      </Card>

      <Tabs defaultValue="approved">
        <TabsList>
          <TabsTrigger value="approved">{copy.tabApproved}</TabsTrigger>
          {canModerate && (
            <TabsTrigger value="pending">
              {copy.tabPending}
              {pendingCount > 0 ? ` (${pendingCount})` : ""}
            </TabsTrigger>
          )}
          <TabsTrigger value="mine">{copy.tabMine}</TabsTrigger>
        </TabsList>

        <TabsContent value="approved" className="pt-4">
          <ResourceGrid items={approved} emptyLabel={copy.emptyApproved} copy={copy} />
        </TabsContent>

        {canModerate && (
          <TabsContent value="pending" className="pt-4">
            <ResourceReviewList
              items={pending}
              onCurate={curate}
              pending={curating}
              copy={copy}
            />
          </TabsContent>
        )}

        <TabsContent value="mine" className="pt-4">
          <ResourceGrid items={mine} emptyLabel={copy.emptyMine} copy={copy} showStatus />
        </TabsContent>
      </Tabs>
    </div>
  );
}
