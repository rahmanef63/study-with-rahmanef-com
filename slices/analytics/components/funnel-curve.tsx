"use client";
// analytics slice — the retention curve. THE ONLY CHART IN THIS SLICE.
//
// WHY A CHART HERE AND NOWHERE ELSE. Every other number on this screen is one
// value, and a list says a value better than a chart does. This one is a
// SHAPE: whether readers trickle away evenly across twenty materi or fall off a
// cliff at materi three are two different problems with two different fixes,
// and no column of percentages shows the difference at a glance. That is the
// whole justification — the moment it would render fewer than three points it
// stops earning its 150kB and the caller renders nothing (see `MIN_POINTS`).
//
// It is `aria-hidden` and duplicated in full by FunnelStepList below it, which
// is the accessible truth. The wrapper carries a sentence summary so a screen
// reader still gets the headline instead of an unlabelled graphic.
//
// LOADED LAZILY. recharts is ~150kB and the console has six tabs; the view
// imports this module through `next/dynamic` so it is fetched only when an
// instructor actually opens a course.
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { biggestDrop } from "../lib/dropoff";
import type { FunnelStepData } from "../types";

/** Below this a curve is two dots and a line — a list already said it. */
export const MIN_POINTS = 3;

export type FunnelCurveProps = {
  steps: readonly FunnelStepData[];
  /** Sentence read in place of the graphic. Composed by the view. */
  label: string;
};

export function FunnelCurve({ steps, label }: FunnelCurveProps) {
  if (steps.length < MIN_POINTS) return null;
  const worst = biggestDrop(steps);
  const data = steps.map((step, index) => ({
    position: index + 1,
    retentionPct: step.retentionPct,
  }));

  return (
    <div role="img" aria-label={label} className="border-2 border-border bg-card p-2">
      {/* Short on a phone (390px) and only a little taller from sm up: the
          curve is a glance, and every pixel it takes is a pixel of the list
          that holds the actual answer. */}
      <div className="h-28 w-full sm:h-36">
        <ResponsiveContainer width="100%" height="100%">
          {/* left: 0. A negative left margin (the usual trick for reclaiming
              recharts' axis gutter) clipped "100" and "50" down to their last
              digit at 390px — three ticks that all read "0". Measured, not
              guessed: see the YAxis width below. */}
          <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="2 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="position"
              tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
              stroke="var(--color-border)"
              interval="preserveStartEnd"
              // Ticks are teaching POSITIONS, not titles: twenty materi names
              // cannot fit under a 390px axis, and the list below names them
              // against the same numbers.
              minTickGap={12}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 50, 100]}
              tickFormatter={(value: number) => `${value}%`}
              tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
              stroke="var(--color-border)"
              // Wide enough for "100%" at 10px in the pixel face plus the tick
              // mark. The axis is percent of the FIRST step's readers, which is
              // why it is labelled at all — an unlabelled 0–100 gridline on a
              // decaying curve reads as an absolute headcount.
              width={38}
            />
            {/* `linear`, never `monotone`: a smoothed curve rounds a cliff into
                a slope, which is exactly the feature being looked for. */}
            <Area
              type="linear"
              dataKey="retentionPct"
              stroke="var(--color-primary)"
              strokeWidth={2}
              fill="var(--color-primary)"
              fillOpacity={0.18}
              isAnimationActive={false}
              dot={false}
            />
            {worst === null ? null : (
              <ReferenceDot
                x={worst.toPosition}
                y={steps[worst.stepIndex].retentionPct}
                r={4}
                fill="var(--color-destructive)"
                stroke="var(--color-card)"
                strokeWidth={2}
              />
            )}
            {/* No <Tooltip/> on purpose: hover is not available on the 390px
                target, and everything a tooltip would say is a row below. */}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
