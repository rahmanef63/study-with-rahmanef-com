/** Review-tab comment model. Comments anchor to a top-level node index in the
 *  parsed document (`anchor`), or to the whole document (`anchor: null`).
 *  Controlled via MarkdownPage props (`comments` + `onAddComment` /
 *  `onResolveComment`); when the callbacks are omitted the page falls back to
 *  internal state so the slice works standalone. Pure / no React. */

export interface MdComment {
  id: string;
  /** Top-level MdNode index the comment is attached to; null = whole doc. */
  anchor: number | null;
  text: string;
  author?: string;
  resolved?: boolean;
  createdAt?: number;
}

export const newCommentId = () => Math.random().toString(36).slice(2, 10);

export function commentsFor(comments: MdComment[], anchor: number | null): MdComment[] {
  return comments.filter((c) => c.anchor === anchor);
}

export function openCount(comments: MdComment[]): number {
  return comments.filter((c) => !c.resolved).length;
}
