// Vendored from notion-page-clone frontend/shared/types/domain.ts (property
// section, M2c) — split from database.ts for the 200-line file cap.

/** ===== Database / properties ===== */

export type PropertyType =
  | "text"
  | "number"
  | "select"
  | "multi_select"
  | "status"
  | "date"
  | "person"
  | "checkbox"
  | "url"
  | "email"
  | "phone"
  | "files"
  | "relation"
  | "rollup"
  | "formula"
  | "created_time"
  | "created_by"
  | "last_edited_time"
  | "last_edited_by"
  | "unique_id"
  | "button"
  | "place"
  | "verification"
  | "ai_summary"      // AI-generated row summary
  | "ai_translation"  // AI-translated text
  | "ai_keywords"     // AI-extracted keywords
  | "ai_custom";      // user-prompted AI autofill

/** Calculate aggregate for the table footer. Mirrors Notion's
 *  per-type set; UI gates which aggregates are valid for which
 *  property type (see `lib/calcAggregate.ts`). */
export type CalcKind =
  | "none"
  | "count_all"
  | "count_values"
  | "count_unique_values"
  | "count_empty"
  | "count_not_empty"
  | "percent_empty"
  | "percent_not_empty"
  | "sum"
  | "average"
  | "median"
  | "min"
  | "max"
  | "range"
  | "checked"
  | "unchecked"
  | "percent_checked"
  | "percent_unchecked"
  | "earliest_date"
  | "latest_date"
  | "date_range";

/** Button property action. Minimal runner — extend with action engine later. */
export type ButtonAction =
  | { kind: "open_url"; url: string }
  | { kind: "open_page"; pageId: string }
  | { kind: "edit_property"; propId: string; value: PropertyValue }
  | { kind: "show_confirmation"; message: string };

export interface SelectOption {
  id: string;
  name: string;
  color: string; // semantic palette key
}

export type NumberFormat = "number" | "decimal" | "percent" | "currency";

export interface Property {
  id: string;
  name: string;
  type: PropertyType;
  hidden?: boolean;
  /** Optional column-level description (shown in property panel + form view). */
  description?: string;
  options?: SelectOption[]; // select / multi_select / status

  /** ─── Number formatting (type === "number") ───────────────── */
  /** Display format. Default: "number" (plain). */
  numberFormat?: NumberFormat;
  /** Fraction digits 0-4. Default: 0 for "number", 2 for decimal/currency, 0 for percent. */
  numberDecimals?: number;
  /** ISO 4217 code when numberFormat === "currency". e.g. "USD","EUR","IDR","GBP","JPY". */
  numberCurrencyCode?: string;

  /** ─── Relation (type === "relation") ──────────────────────── */
  /** Target database. null/undefined means "all database rows" (legacy). */
  relationDatabaseId?: string | null;
  /** When true, link is mirrored on the target db's inverse property. */
  relationTwoWay?: boolean;
  /** Inverse property id on the target db. Created automatically when
   *  twoWay flips on; cleared when it flips off. */
  relationInversePropertyId?: string;

  /** ─── Rollup (type === "rollup") ──────────────────────────── */
  /** Property id of the relation prop on THIS db that points to the
   *  target db. */
  rollupRelationPropertyId?: string | null;
  /** Property id on the target db whose value is being rolled up. */
  rollupTargetPropertyId?: string | null;
  rollupAggregate?:
    | "count"
    | "count_unique"
    | "values"
    | "sum"
    | "avg"
    | "min"
    | "max"
    | "earliest"
    | "latest"
    | "checked"
    | "percent_checked";

  /** ─── Formula (type === "formula") ────────────────────────── */
  /** Mock formula expression. Supports {{title}}, {{Property}}, and simple =math. */
  formulaExpression?: string;

  /** ─── Unique ID (type === "unique_id") ────────────────────── */
  uniqueIdPrefix?: string;

  /** ─── URL (type === "url") ────────────────────────────────── */
  /** When false (default), URL cells render the trimmed host/path
   *  with link styling. When true, the entire href shows verbatim. */
  urlShowFull?: boolean;

  /** ─── Button (type === "button") ──────────────────────────── */
  buttonLabel?: string;
  buttonActions?: ButtonAction[];

  /** ─── Date (type === "date") ──────────────────────────────── */
  /** Display format for dates in cells. Default: "full". */
  dateFormat?: "full" | "short" | "mdy" | "dmy" | "ymd" | "relative";
  /** Clock format when `dateIncludeTime` is on. Default: "12h". */
  timeFormat?: "12h" | "24h";
  /** When true, cells render a time alongside the date. */
  dateIncludeTime?: boolean;
  /** Reminder offset before the date. "none" = no reminder. */
  dateNotification?: "none" | "at_time" | "5m" | "10m" | "30m" | "1h" | "1d" | "2d";
}

export type PropertyValue =
  | string
  | number
  | boolean
  | null
  | string[] // multi_select option ids, person ids, relation ids, or mock files
  | { date?: string; end?: string; time?: string; endTime?: string }
  /** verification prop: `verified` flag + audit (by user id, at epoch ms). */
  | { verified: boolean; by?: string; at?: number };
  // date prop: `date`/`time` = start; `end`/`endTime` = optional range end.
  // `date`/`end` are YYYY-MM-DD; `time`/`endTime` are HH:mm (24h) regardless of display timeFormat.
