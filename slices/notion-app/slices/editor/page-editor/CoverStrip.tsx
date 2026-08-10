"use client";

/**
 * Static page-cover banner (M2c). The source mounted the interactive
 * CoverBanner from @/slices/cover (reposition / re-pick / unsplash search) —
 * a peer slice the seam doesn't reach. This renders the persisted CoverField
 * read-only; hosts wanting cover EDITING mount their own banner above the
 * editor and own the updatePage write.
 */

import Image from "next/image";
import type { CoverData, CoverField } from "@notion/shared/types";

function isImageCover(c: CoverData): boolean {
  return c.type === "upload" || c.type === "link" || c.type === "unsplash";
}

export function CoverStrip({ cover }: { cover: CoverField }) {
  if (!cover) return null;
  // Legacy string covers are raw CSS backgrounds (gradient/color).
  const data: CoverData =
    typeof cover === "string" ? { type: "gradient", value: cover } : cover;

  if (isImageCover(data)) {
    return (
      <div className="relative h-44 w-full overflow-hidden">
        <Image
          src={data.value}
          alt=""
          fill
          unoptimized
          className="object-cover"
          style={{ objectPosition: `center ${data.positionY ?? 50}%` }}
        />
      </div>
    );
  }

  return <div className="h-44 w-full" style={{ background: data.value }} />;
}
