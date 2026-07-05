# `responsive-dialog` slice — facade

Drop-in replacement for shadcn `Dialog`. Auto-switches between bottom
Sheet (mobile) and centered Modal (desktop) at the `md` breakpoint.

> Kitab rule #2: forbid raw `<dialog>` / `<Dialog>` — always use
> `ResponsiveDialog`. This slice is the registry entry that enforces it.

## Usage

```tsx
import {
  ResponsiveDialog,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from "@/features/responsive-dialog";

<ResponsiveDialog open={open} onOpenChange={setOpen} variant="modal" size="md">
  <ResponsiveDialogHeader>
    <ResponsiveDialogTitle>Konfirmasi</ResponsiveDialogTitle>
  </ResponsiveDialogHeader>
  <ResponsiveDialogBody>…</ResponsiveDialogBody>
  <ResponsiveDialogFooter>
    <Button onClick={…}>Lanjut</Button>
  </ResponsiveDialogFooter>
</ResponsiveDialog>
```

Variants: `modal | panel | alert`. Sizes: `sm | md | lg | xl | full`.
Mobile rendering: `drawer-bottom` (default) or `drawer-right`.

## Deps

- shadcn `dialog`, `sheet`
