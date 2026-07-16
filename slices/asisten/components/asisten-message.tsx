"use client";
// asisten slice — satu gelembung chat (presentational, props-driven).
import { cn } from "@/lib/utils";
import type { AsistenMessage } from "../types";

export type AsistenMessageBubbleProps = {
  message: AsistenMessage;
  /** Placeholder saat jawaban masih dialirkan. */
  pendingLabel?: string;
  className?: string;
};

export function AsistenMessageBubble({
  message,
  pendingLabel = "…",
  className,
}: AsistenMessageBubbleProps) {
  const isUser = message.role === "user";
  return (
    <div
      className={cn(
        "max-w-[88%] whitespace-pre-wrap rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
        isUser
          ? "self-end bg-primary text-primary-foreground"
          : "self-start border border-border bg-card text-foreground",
        className
      )}
    >
      {message.text.length > 0 ? message.text : pendingLabel}
    </div>
  );
}
