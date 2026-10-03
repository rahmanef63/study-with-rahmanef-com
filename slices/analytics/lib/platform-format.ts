/** Stable formatting shared by the accessible tables and aggregate CSV export. */
export const platformNumber = (value: number) => new Intl.NumberFormat("id-ID").format(value);
export const platformPercent = (value: number | null) => value === null ? "—" : `${platformNumber(value)}%`;
export const platformDate = (value: number | string, detailed = false) => new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta", day: "numeric", month: "short", ...(detailed ? { year: "numeric", hour: "2-digit", minute: "2-digit" } : {}),
}).format(typeof value === "string" ? new Date(`${value}T00:00:00+07:00`) : value);

export type AggregateColumn<Row> = { key: string; label: string; value: (row: Row) => string | number | null; format?: (row: Row) => string };

/** Quoting alone does not prevent spreadsheet formulas in admin-controlled titles. */
export function aggregateCsv<Row>(rows: readonly Row[], columns: readonly AggregateColumn<Row>[]): string {
  const cell = (value: string | number | null) => {
    let text = value === null ? "" : String(value);
    if (typeof value === "string" && /^[\s]*[=+\-@]/u.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  return `\uFEFF${[columns.map((column) => cell(column.label)).join(","), ...rows.map((row) => columns.map((column) => cell(column.value(row))).join(","))].join("\r\n")}\r\n`;
}

export function downloadAggregateCsv<Row>(filename: string, rows: readonly Row[], columns: readonly AggregateColumn<Row>[]) {
  const url = URL.createObjectURL(new Blob([aggregateCsv(rows, columns)], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
