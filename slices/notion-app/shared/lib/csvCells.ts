/** Property value → display string, the one cell-formatter the MD/HTML
 *  exporters need. Vendored from notion-page-clone `shared/lib/csv.ts`
 *  (only `valueToCell` + its `formatDate` helper — the full CSV module
 *  with BOM/RFC-4180 quoting isn't ported; nothing here imports the app).
 *  Types via `@notion/shared/types`. Pure / no React. */

import type { Property, PropertyValue, Page } from "../types";

function formatDate(iso: string | undefined): string {
  if (!iso) return "";
  // ISO YYYY-MM-DD → MM/DD/YYYY (Notion's expected format)
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${m[2]}/${m[3]}/${m[1]}`;
}

export function valueToCell(prop: Property, value: PropertyValue, allPages?: Page[]): string {
  if (value == null) return "";
  switch (prop.type) {
    case "text":
    case "url":
    case "email":
    case "phone":
      return String(value);
    case "number": {
      if (typeof value !== "number") return "";
      if (prop.numberFormat === "currency") {
        return `${prop.numberCurrencyCode ?? ""}${value}`.trim();
      }
      if (prop.numberFormat === "percent") return `${value}%`;
      return String(value);
    }
    case "checkbox":
      return value ? "Yes" : "No";
    case "select":
    case "status": {
      const opt = prop.options?.find((o) => o.id === value);
      return opt?.name ?? "";
    }
    case "multi_select": {
      if (!Array.isArray(value)) return "";
      return value
        .map((id) => prop.options?.find((o) => o.id === id)?.name ?? "")
        .filter(Boolean)
        .join(", ");
    }
    case "date": {
      const v = value as { date?: string; end?: string };
      if (!v?.date) return "";
      return v.end ? `${formatDate(v.date)} - ${formatDate(v.end)}` : formatDate(v.date);
    }
    case "person": {
      if (!Array.isArray(value)) return "";
      return value.join(", ");
    }
    case "relation": {
      // Resolve to row titles when we have the page list — the human
      // reading the export wants titles, not opaque ids.
      if (!Array.isArray(value)) return "";
      if (allPages) {
        return value
          .map((id) => allPages.find((p) => p.id === id)?.title || String(id))
          .join(", ");
      }
      return value.join(", ");
    }
    case "files": {
      if (!Array.isArray(value)) return "";
      return value.map((f) => (typeof f === "string" ? f : (f as { url?: string }).url ?? "")).filter(Boolean).join(", ");
    }
    case "place":
      return typeof value === "string" ? value : "";
    case "unique_id":
      return String(value ?? "");
    case "created_time":
    case "last_edited_time":
      return typeof value === "number" ? new Date(value).toLocaleString() : "";
    case "created_by":
    case "last_edited_by":
      return String(value ?? "");
    case "formula":
    case "rollup":
    case "button":
    case "verification":
      return ""; // Computed / interactive — recomputed by the target.
    default:
      return typeof value === "string" || typeof value === "number" || typeof value === "boolean"
        ? String(value)
        : "";
  }
}
