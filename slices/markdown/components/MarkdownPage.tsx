"use client";

/** MarkdownPage — the markdown slice's page container with optional CRUD
 *  surfaces:
 *
 *    read   — rendered rich-text document (default, always available)
 *    write  — raw source editor + live preview
 *    review — rendered doc with block-anchored comments
 *
 *  `tabs` picks the surfaces; a single tab renders without tab chrome.
 *  Content and comments are controlled when callbacks are passed
 *  (`onContentChange`, `onAddComment`/`onResolveComment`) and fall back to
 *  internal state otherwise, so the page works standalone. Renders
 *  ```mermaid diagrams and ```chart charts in all surfaces. */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseMarkdown } from "../lib/parse";
import { type MdComment, newCommentId, openCount } from "../lib/comments";
import { MarkdownReader } from "./MarkdownReader";
import { WriteTab } from "./WriteTab";
import { ReviewTab } from "./ReviewTab";

export type MarkdownTab = "read" | "write" | "review";

const TAB_LABEL: Record<MarkdownTab, string> = { read: "Read", write: "Write", review: "Review" };

export interface MarkdownPageProps {
  /** Markdown source (controlled when `onContentChange` is set). */
  content: string;
  onContentChange?: (next: string) => void;
  /** Surfaces to expose. Default `["read"]`. */
  tabs?: MarkdownTab[];
  /** Review comments (controlled when `onAddComment` is set). */
  comments?: MdComment[];
  onAddComment?: (comment: MdComment) => void;
  onResolveComment?: (id: string) => void;
  /** Author stamped onto comments created in this session. */
  commentAuthor?: string;
  title?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function MarkdownPage({
  content,
  onContentChange,
  tabs = ["read"],
  comments,
  onAddComment,
  onResolveComment,
  commentAuthor,
  title,
  icon,
  className,
}: MarkdownPageProps) {
  // Uncontrolled fallbacks — slice works standalone without any wiring.
  const [localContent, setLocalContent] = React.useState(content);
  const [localComments, setLocalComments] = React.useState<MdComment[]>([]);
  React.useEffect(() => { setLocalContent(content); }, [content]);

  const md = onContentChange ? content : localContent;
  const setMd = onContentChange ?? setLocalContent;
  const allComments = comments ?? localComments;

  const addComment = (anchor: number | null, text: string) => {
    const comment: MdComment = {
      id: newCommentId(), anchor, text, author: commentAuthor, createdAt: Date.now(),
    };
    if (onAddComment) onAddComment(comment);
    else setLocalComments((prev) => [...prev, comment]);
  };

  const resolveComment = (id: string) => {
    if (onResolveComment) onResolveComment(id);
    else setLocalComments((prev) => prev.map((c) => (c.id === id ? { ...c, resolved: true } : c)));
  };

  const nodes = React.useMemo(() => parseMarkdown(md), [md]);
  const open = openCount(allComments);
  const list = tabs.length ? tabs : (["read"] as MarkdownTab[]);

  const header = title && (
    <header className="mb-4 flex items-center gap-2">
      {icon && <span className="text-2xl leading-none">{icon}</span>}
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
    </header>
  );

  const surface = (tab: MarkdownTab) => {
    switch (tab) {
      case "read":
        return <MarkdownReader nodes={nodes} maxWidth="none" className="px-0 py-0" />;
      case "write":
        return <WriteTab value={md} onChange={setMd} />;
      case "review":
        return <ReviewTab nodes={nodes} comments={allComments} onAdd={addComment} onResolve={resolveComment} />;
    }
  };

  if (list.length === 1) {
    return (
      <article className={cn("mx-auto w-full max-w-3xl px-4 py-6", className)}>
        {header}
        {surface(list[0]!)}
      </article>
    );
  }

  return (
    <article className={cn("mx-auto w-full max-w-4xl px-4 py-6", className)}>
      {header}
      <Tabs defaultValue={list[0]}>
        <TabsList>
          {list.map((tab) => (
            <TabsTrigger key={tab} value={tab} className="text-xs">
              {TAB_LABEL[tab]}
              {tab === "review" && open > 0 && (
                <span className="ml-1 rounded-full bg-amber-500/20 px-1.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">{open}</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        {list.map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            {surface(tab)}
          </TabsContent>
        ))}
      </Tabs>
    </article>
  );
}
