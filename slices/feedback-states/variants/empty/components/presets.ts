import {
  FileQuestion,
  Ghost,
  Inbox,
  Lock,
  Rocket,
  SearchX,
  ServerCrash,
  type LucideIcon,
} from "lucide-react";

export type EmptyStateKind =
  | "404"
  | "500"
  | "403"
  | "no-results"
  | "empty-list"
  | "first-use";

export interface EmptyStatePreset {
  icon: LucideIcon;
  title: string;
  description: string;
}

/** kind → default {icon, title, description}. Any field is overridable via props. */
export const EMPTY_STATE_PRESETS: Record<EmptyStateKind, EmptyStatePreset> = {
  "404": {
    icon: FileQuestion,
    title: "Page not found",
    description: "The page you're looking for doesn't exist or has been moved.",
  },
  "500": {
    icon: ServerCrash,
    title: "Something went wrong",
    description:
      "An unexpected error occurred on our end. Please try again in a moment.",
  },
  "403": {
    icon: Lock,
    title: "Access denied",
    description: "You don't have permission to view this resource.",
  },
  "no-results": {
    icon: SearchX,
    title: "No results found",
    description: "Try adjusting your search or filters to find what you need.",
  },
  "empty-list": {
    icon: Inbox,
    title: "Nothing here yet",
    description: "Items you create will show up in this list.",
  },
  "first-use": {
    icon: Rocket,
    title: "Get started",
    description: "Create your first item to begin — it only takes a moment.",
  },
};

/** Fallback icon for unknown/overridden kinds. */
export const FALLBACK_ICON: LucideIcon = Ghost;
