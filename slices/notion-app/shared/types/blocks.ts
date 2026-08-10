// Vendored core block/page model for the notion cluster.
//
// Lifted from notion-page-clone `frontend/shared/types/domain.ts` — but
// decoupled: database/property-specific fields are typed `unknown` here so
// the editor core does NOT drag in the full Database/Property/view model.
// The databases inner slice (future) owns those types and overlays them via
// the EditorAdapter seam. Keep this file the single source of the Block shape.

export type BlockType =
  | "paragraph"
  | "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  | "todo"
  | "bullet"
  | "numbered"
  | "quote"
  | "code"
  | "divider"
  | "callout"
  | "page"
  | "database"
  | "columns2" | "columns3" | "columns4" | "columns5"
  | "toggle"
  | "image"
  | "equation"
  | "table"
  | "embed"
  | "button"
  | "synced"
  | "toc"
  | "audio"
  | "video";

export interface Block {
  id: string;
  type: BlockType;
  text: string;
  checked?: boolean;
  lang?: string;
  pageId?: string;
  databaseId?: string;
  /** Per-block active view selection for linked database views. */
  activeViewId?: string;
  /** Per-block view-config overrides (database slice owns the shape). */
  viewOverrides?: Record<string, unknown>;
  /** for columns2/columns3: array of column block arrays */
  columns?: Block[][];
  /** for toggle: child blocks */
  children?: Block[];
  collapsed?: boolean;
  /** for image/embed: source URL and optional caption */
  url?: string;
  caption?: string;
  /** for table: 2D grid of cell text */
  tableRows?: string[][];
  tableHeader?: boolean;
  /** for image: width as % of container; undefined = auto */
  width?: number;
  align?: "left" | "center" | "right";
  /** for columns: per-column width as % of container; sum ≈ 100 */
  colWidths?: number[];
  /** Layout grouping — adjacent blocks sharing layoutGroup form one row. */
  layoutGroup?: string;
  layoutCol?: number;
  /** List nesting depth (0 = top, 1..3 = nested). */
  indent?: number;
  calloutKind?: "note" | "tip" | "warning" | "important" | "caution" | "default";
  tableAlign?: ("left" | "center" | "right")[];
  /** Notion-style text + background color palette keys (see lib/colors). */
  color?: string;
  bgColor?: string;
  /** Synced block grouping. Source owns children; ref mirrors read-only. */
  syncId?: string;
  syncRef?: boolean;
}

export type PageFont = "default" | "serif" | "mono";

export type CoverType =
  | "color" | "gradient" | "texture" | "upload" | "link" | "unsplash";

export interface CoverData {
  type: CoverType;
  value: string;
  positionY?: number;
  metadata?: Record<string, unknown>;
}

export type CoverField = string | null | CoverData;

export interface ColumnLayout {
  id: string;
  type: "columns";
  count: number;
  widths?: number[];
}

export interface Page {
  id: string;
  parentId: string | null;
  title: string;
  icon: string;
  cover?: CoverField;
  blocks: Block[];
  layouts?: ColumnLayout[];
  favorite: boolean;
  trashed: boolean;
  createdAt: number;
  updatedAt: number;
  workspaceId?: string;
  isPublic?: boolean;
  /** Database-row metadata — the databases slice owns the value shapes. */
  rowOfDatabaseId?: string;
  rowProps?: Record<string, unknown>;
  font?: PageFont;
  smallText?: boolean;
  fullWidth?: boolean;
  locked?: boolean;
  blockCount?: number;
  previewText?: string;
}
