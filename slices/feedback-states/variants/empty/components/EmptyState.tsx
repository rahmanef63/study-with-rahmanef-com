import * as React from "react";
import type { LucideIcon } from "lucide-react";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  EMPTY_STATE_PRESETS,
  FALLBACK_ICON,
  type EmptyStateKind,
} from "./presets";

export interface EmptyStateAction {
  label: string;
  /** Consumer-routed href; renders Button asChild with an anchor. */
  href?: string;
  onClick?: () => void;
}

export interface EmptyStateProps {
  kind?: EmptyStateKind;
  icon?: LucideIcon;
  title?: React.ReactNode;
  description?: React.ReactNode;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  /** Tighter spacing for inline/empty-list usage. */
  compact?: boolean;
  className?: string;
}

function ActionButton({
  action,
  variant,
}: {
  action: EmptyStateAction;
  variant: "default" | "outline";
}) {
  if (action.href) {
    return (
      <Button asChild variant={variant} size="sm">
        {/* href is consumer-routed; slices pass it through verbatim. */}
        <a href={action.href} onClick={action.onClick}>
          {action.label}
        </a>
      </Button>
    );
  }
  return (
    <Button variant={variant} size="sm" type="button" onClick={action.onClick}>
      {action.label}
    </Button>
  );
}

/**
 * Configurable empty / error state. Pick a `kind` for sensible defaults
 * (icon + title + description) or override any slot via props. Composes the
 * shadcn `Empty` primitive; actions render as shadcn Buttons.
 */
export function EmptyState({
  kind,
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  compact = false,
  className,
}: EmptyStateProps) {
  const preset = kind ? EMPTY_STATE_PRESETS[kind] : undefined;
  const Icon = icon ?? preset?.icon ?? FALLBACK_ICON;
  const resolvedTitle = title ?? preset?.title ?? "Nothing here";
  const resolvedDescription = description ?? preset?.description;

  return (
    <Empty
      className={cn("border", compact && "gap-3 p-4 md:p-6", className)}
      data-kind={kind}
    >
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{resolvedTitle}</EmptyTitle>
        {resolvedDescription ? (
          <EmptyDescription>{resolvedDescription}</EmptyDescription>
        ) : null}
      </EmptyHeader>
      {primaryAction || secondaryAction ? (
        <EmptyContent>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {primaryAction ? (
              <ActionButton action={primaryAction} variant="default" />
            ) : null}
            {secondaryAction ? (
              <ActionButton action={secondaryAction} variant="outline" />
            ) : null}
          </div>
        </EmptyContent>
      ) : null}
    </Empty>
  );
}
