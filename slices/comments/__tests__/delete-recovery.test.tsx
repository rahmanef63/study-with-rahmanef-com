// @vitest-environment node
import type { ReactElement } from "react";
import { expect, test, vi } from "vitest";
import { DeleteCommentDialog } from "../components/delete-comment-dialog";
import { COMMENTS_COPY } from "../config/copy";

vi.mock("@/features/responsive-dialog", () => ({
  ResponsiveDialog: "div", ResponsiveDialogBody: "div", ResponsiveDialogFooter: "div",
  ResponsiveDialogHeader: "div", ResponsiveDialogTitle: "h2",
}));

test.each([false, true, undefined])("delete confirmation closes only after success (%s)", async (result) => {
  const onOpenChange = vi.fn();
  const dialog = DeleteCommentDialog({ open: true, onOpenChange, onConfirm: async () => result,
    pending: false, copy: COMMENTS_COPY });
  const footer = (dialog.props as { children: ReactElement[] }).children[2] as
    ReactElement<{ children: ReactElement<{ onClick: () => Promise<void> }>[] }>;
  await footer.props.children[1].props.onClick();
  expect(onOpenChange).toHaveBeenCalledTimes(result === false ? 0 : 1);
});

test("pending deletion cannot be dismissed or confirmed twice", async () => {
  const onOpenChange = vi.fn();
  const onConfirm = vi.fn();
  const dialog = DeleteCommentDialog({ open: true, onOpenChange, onConfirm, pending: true, copy: COMMENTS_COPY });
  const props = dialog.props as { onOpenChange: (open: boolean) => void; children: ReactElement[] };
  props.onOpenChange(false);
  const footer = props.children[2] as ReactElement<{ children: ReactElement<{ onClick: () => Promise<void> }>[] }>;
  await footer.props.children[1].props.onClick();
  expect(onOpenChange).not.toHaveBeenCalled();
  expect(onConfirm).not.toHaveBeenCalled();
});
