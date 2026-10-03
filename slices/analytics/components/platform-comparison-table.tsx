"use client";
import { useId, useState } from "react";
import { ArrowDown, ArrowUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadAggregateCsv, platformNumber, type AggregateColumn } from "../lib/platform-format";

export type PlatformComparisonTableProps<Row> = {
  title: string;
  hint?: string;
  rows: readonly Row[];
  columns: readonly AggregateColumn<Row>[];
  rowKey: (row: Row) => string;
  filename: string;
  empty: string;
  minWidth?: number;
  initialSortKey?: string;
  initialDescending?: boolean;
  labels: { sort: string; export: string; ascending: string; descending: string; rows: string; scroll: string };
};

export function PlatformComparisonTable<Row>({ title, hint, rows, columns, rowKey, filename, empty, labels, minWidth = 640, initialSortKey, initialDescending = false }: PlatformComparisonTableProps<Row>) {
  const id = useId();
  const [sortKey, setSortKey] = useState(initialSortKey ?? columns[0].key);
  const [descending, setDescending] = useState(initialDescending);
  const sorted = [...rows].sort((a, b) => {
    const column = columns.find((candidate) => candidate.key === sortKey) ?? columns[0];
    const left = column.value(a);
    const right = column.value(b);
    if (left === null) return right === null ? 0 : 1;
    if (right === null) return -1;
    const order = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right), "id");
    return descending ? -order : order;
  });
  return (
    <section aria-labelledby={`${id}-title`} className="min-w-0 space-y-3 border-t border-border pt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0"><h2 id={`${id}-title`} className="text-lg font-semibold">{title}</h2>{hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}</div>
        <Button variant="outline" className="min-h-11" disabled={rows.length === 0} onClick={() => downloadAggregateCsv(filename, sorted, columns)}><Download aria-hidden="true" />{labels.export}</Button>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <label htmlFor={`${id}-sort`}>{labels.sort}</label>
        <select id={`${id}-sort`} value={sortKey} onChange={(event) => setSortKey(event.target.value)} className="min-h-11 min-w-0 max-w-full rounded-[var(--radius)] border border-input bg-background px-3 focus-visible:outline-2 focus-visible:outline-ring">
          {columns.map((column) => <option key={column.key} value={column.key}>{column.label}</option>)}
        </select>
        <Button variant="ghost" className="min-h-11" aria-label={descending ? labels.descending : labels.ascending} onClick={() => setDescending((value) => !value)}>{descending ? <ArrowDown aria-hidden="true" /> : <ArrowUp aria-hidden="true" />}{descending ? labels.descending : labels.ascending}</Button>
        <span className="text-muted-foreground">{platformNumber(rows.length)} {labels.rows}</span>
      </div>
      {rows.length === 0 ? <p className="py-6 text-sm text-muted-foreground">{empty}</p> : <>
        <p className="text-xs text-muted-foreground sm:hidden">{labels.scroll}</p>
        <div role="region" aria-label={title} tabIndex={0} className="max-h-[32rem] min-w-0 overflow-auto border-y border-border focus-visible:outline-2 focus-visible:outline-ring">
          <table className="w-full text-left text-sm" style={{ minWidth }}>
            <caption className="sr-only">{title}{hint ? ` — ${hint}` : ""}</caption>
            <thead className="sticky top-0 z-10 bg-background"><tr>{columns.map((column) => <th scope="col" key={column.key} aria-sort={column.key === sortKey ? descending ? "descending" : "ascending" : undefined} className="border-b border-border px-3 py-3 font-medium text-muted-foreground">{column.label}</th>)}</tr></thead>
            <tbody>{sorted.map((row) => <tr key={rowKey(row)} className="border-b border-border/60 last:border-0">{columns.map((column, index) => {
              const value = column.value(row);
              return <td key={column.key} className={index === 0 ? "min-w-48 max-w-80 break-words px-3 py-3 font-medium" : "px-3 py-3 tabular-nums"}>{column.format?.(row) ?? (value === null ? "—" : typeof value === "number" ? platformNumber(value) : value)}</td>;
            })}</tr>)}</tbody>
          </table>
        </div>
      </>}
    </section>
  );
}
