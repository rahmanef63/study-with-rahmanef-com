"use client";
// The money section. Ordered by what is worth most to the reader, which is NOT
// the order a business would pick:
//   1. what you already pay for, and how to actually use it;
//   2. what you can STOP paying for (the engine treats "cancel one" as a
//      first-class output, and this section renders it in the loudest tone on
//      the screen after the CTA);
//   3. the free tiers, described by mechanism so they do not rot;
//   4. what is worth buying — often "nothing", and it says so.
//
// An Rp0 run produces an EMPTY `paid` array, so that group disappears
// entirely; there is no upsell hiding behind a disclosure here.
import { Coins, PiggyBank, Sparkles, Wallet } from "lucide-react";
import type { BudgetAdvice } from "@/lib/peta";

function Group({
  icon,
  title,
  items,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  items: readonly string[];
  tone?: "save";
}) {
  if (items.length === 0) return null;
  return (
    <section
      className={`border p-4 ${tone === "save" ? "border-success/60 bg-success/5" : "border-border bg-card"}`}
    >
      <h4 className="flex items-center gap-2 font-display text-caption uppercase">
        <span aria-hidden className={tone === "save" ? "text-success" : "text-muted-foreground"}>
          {icon}
        </span>
        {title}
      </h4>
      <ul className="mt-3 grid gap-2">
        {items.map((line) => (
          <li key={line} className="text-pretty text-footnote text-muted-foreground">
            {line}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function BudgetBlock({ budget }: { budget: BudgetAdvice }) {
  return (
    <section className="space-y-3">
      <h2>Soal biaya</h2>
      <p className="text-pretty text-body">{budget.headline}</p>
      <Group
        icon={<Wallet className="size-3.5" />}
        title="Yang sudah kamu bayar"
        items={budget.useWhatYouPayFor}
      />
      <Group
        icon={<PiggyBank className="size-3.5" />}
        title="Bisa berhenti bayar"
        items={budget.savings}
        tone="save"
      />
      <Group icon={<Sparkles className="size-3.5" />} title="Gratisan" items={budget.free} />
      <Group icon={<Coins className="size-3.5" />} title="Kalau mau bayar" items={budget.paid} />
    </section>
  );
}
