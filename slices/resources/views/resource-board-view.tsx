"use client";
// resources slice — ResourceBoardView. Approved grid + submit form + (for
// instructor+) a pending review tab, plus a "Kiriman saya" tab so a submitter
// sees their own pending items. The integrator mounts this at
// /t/[slug]/resources with canModerate = viewer is instructor+.
//
// Security note: `canModerate` only toggles UX — the pending query itself
// requires instructor+ server-side, and curate re-checks the role. A member who
// forces canModerate still gets NOT_AUTHORIZED from Convex.
import type { Id } from "@convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  return (
    <div className={className ? `space-y-6 ${className}` : "space-y-6"}>
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{copy.boardTitle}</h1>
        <p className="text-sm text-muted-foreground">{copy.boardSubtitle}</p>
      </header>

      <Card id="bagikan-sumber" className="scroll-mt-24">
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
