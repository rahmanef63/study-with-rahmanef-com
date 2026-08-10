// Vendored from notion-page-clone frontend/shared/types/domain.ts (database
// section, M2c). Property shapes live in ./property (200-line cap split).
import type { Block } from "./blocks";
import type { Property, PropertyValue } from "./property";

export type DbView =
  | "table" | "board" | "list" | "gallery" | "calendar" | "timeline"
  | "chart" | "dashboard" | "feed" | "map" | "form";

export type ChartKind = "bar" | "line" | "area" | "pie" | "donut";
export type ChartAggregate = "count" | "sum" | "avg" | "min" | "max";

export interface DatabaseFilter {
  propertyId: string;
  op: "contains" | "equals" | "not_empty" | "is_empty" | "checked" | "unchecked";
  value?: string;
}

export interface DatabaseSort {
  propertyId: string;
  direction: "asc" | "desc";
}

export interface DatabaseViewConfig {
  id: string;
  name: string;
  type: DbView;
  /** UI-level per-view lock — when true, filter / sort / group / hidden /
   *  frozen / calc / search edits are gated in the frontend. Independent
   *  from `Database.locked` (which gates structural property edits). */
  locked?: boolean;
  groupBy?: string;     // property id (for board)
  sorts: DatabaseSort[];
  filters: DatabaseFilter[];
  search: string;
  /** Chart view: kind of plot */
  chartKind?: ChartKind;
  /** Chart view: category / X axis property id */
  chartXProp?: string;
  /** Chart view: numeric Y property id (omit when aggregate=count) */
  chartYProp?: string;
  /** Chart view: aggregate function */
  chartAggregate?: ChartAggregate;
  /** Map view: numeric latitude property id */
  mapLatProp?: string;
  /** Map view: numeric longitude property id */
  mapLngProp?: string;
  /** Form view: required-field property ids (defaults: all visible) */
  formRequiredProps?: string[];
  /** Form view: shown-field property ids (defaults: all non-hidden) */
  formShownProps?: string[];
  /** Form view: success message after submit */
  formSuccessMessage?: string;

  /** Per-view hidden property ids — independent of global Property.hidden so
   *  hiding a column in one view never affects another. */
  hiddenPropIds?: string[];
  /** Per-view frozen-pinned property ids (Table view). Frozen columns
   *  stick to the left edge with `position: sticky`. */
  frozenPropIds?: string[];
  /** Per-column calculate aggregate (Table view footer). Map propId →
   *  CalcKind. Empty / "none" hides the cell. */
  tableCalcs?: Record<string, string>;
  /** Sub-items tree expansion state (row ids). When unset and the DB
   *  has subItemsParentPropId, defaults to all-expanded. Persisted
   *  per-view so collapse state survives navigation. */
  subItemsExpanded?: string[];
  /** Feed view: secondary timestamp source */
  feedTimestamp?: "createdAt" | "updatedAt";

  // ─── Table view ──────────────────────────────────────
  tableWrapCells?: boolean;
  tableRowHeight?: "short" | "medium" | "tall";

  // ─── Board view ──────────────────────────────────────
  /** Number of card props rendered (besides title). */
  boardCardSize?: "small" | "medium" | "large";
  /** Property ids shown on each card. */
  boardCardProps?: string[];
  /** Hide groups with zero rows. */
  boardHideEmptyGroups?: boolean;
  /** Property id used to color cards (select/status). */
  boardColorByProp?: string;
  /** Persisted column order (option ids). The trailing `null` slot for
   *  "no value" is implicit — included if explicitly listed. */
  boardColumnOrder?: string[];

  // ─── Gallery view ────────────────────────────────────
  gallerySize?: "small" | "medium" | "large";
  galleryCoverSource?: "cover" | "property" | "none";
  galleryCoverProp?: string;
  galleryCoverFit?: "cover" | "contain";
  galleryCardProps?: string[];
  galleryAspect?: "square" | "video" | "portrait";

  // ─── List view ───────────────────────────────────────
  listSummaryProps?: string[];
  listDensity?: "compact" | "comfortable";

  // ─── Calendar view ───────────────────────────────────
  calendarDateProp?: string;
  calendarEndProp?: string;
  calendarColorByProp?: string;
  calendarWeekStart?: 0 | 1; // Sunday | Monday
  calendarShowWeekends?: boolean;
  calendarMode?: "month" | "week";
  calendarShowOverdue?: boolean;

  // ─── Timeline view ───────────────────────────────────
  timelineStartProp?: string;
  timelineEndProp?: string;
  timelineZoom?: "day" | "week" | "month" | "quarter";
  timelineColorByProp?: string;
  /** Self-relation property id used to draw dependency arrows.
   *  Each row's value is an array of predecessor row ids (rows that
   *  must complete before this one starts). Auto-detects the first
   *  self-relation prop when unset. */
  timelineDependencyProp?: string;

  // ─── Chart view (additional) ─────────────────────────
  chartShowLegend?: boolean;
  chartShowGrid?: boolean;
  chartTopN?: number;       // 0 = all
  chartSortBy?: "name" | "value";
  chartSortDir?: "asc" | "desc";
  chartPalette?: "warm" | "cool" | "rainbow" | "mono";
  chartDecimals?: number;   // 0..4
  chartTitle?: string;
  chartXLabel?: string;
  chartYLabel?: string;
  chartShowValues?: boolean;
  chartHeight?: "small" | "medium" | "large";

  // ─── Dashboard view ──────────────────────────────────
  dashboardKPIs?: string[];     // numeric / checkbox prop ids
  dashboardBreakdowns?: string[]; // select / status prop ids
  dashboardRecentLimit?: number;

  // ─── Feed view (additional) ──────────────────────────
  feedDensity?: "compact" | "comfortable";
  feedSummaryProps?: string[];

  // ─── Map view (additional) ───────────────────────────
  mapPinColorProp?: string;
  mapShowList?: boolean;

  // ─── Form view (additional) ──────────────────────────
  formTitle?: string;
  formDescription?: string;
  /** Public form: when true, anyone can submit via /forms/<formSlug>
   *  without auth. Submissions land as new rows owned by the database
   *  owner. */
  formIsPublic?: boolean;
  /** Slug for the public form URL. Auto-derived from view.id if blank. */
  formSlug?: string;
}

/** UI-level lock — gates property/view structural edits in the
 *  frontend. Backend doesn't enforce (workspace owner can override
 *  via direct API). Matches Notion's "Lock database" UX. */
export interface Database {
  id: string;
  name: string;
  icon: string;
  properties: Property[];
  /** ordered row-page ids */
  rowIds: string[];
  views: DatabaseViewConfig[];
  activeViewId: string;
  createdAt: number;
  updatedAt: number;
  /** Atomic counter for unique_id properties */
  uniqueIdCounter?: number;
  /** Saved row templates */
  templates?: DatabaseTemplate[];
  /** Default template id applied on plain New */
  defaultTemplateId?: string | null;
  /** Sub-items relation property id (parent → children) */
  subItemsParentPropId?: string | null;
  /** UI lock — prevents property / view structural edits in the
   *  frontend. Backend doesn't enforce (admin override). */
  locked?: boolean;
  /** Soft-delete flag */
  trashed?: boolean;
}

export interface DatabaseTemplate {
  id: string;
  name: string;
  icon?: string;
  /** Seed body blocks for the row page */
  blocks: Block[];
  /** Seed property values keyed by property id */
  rowProps?: Record<string, PropertyValue>;
}

