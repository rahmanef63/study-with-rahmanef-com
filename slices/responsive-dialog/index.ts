/**
 * Responsive Dialog slice — facade over
 * `frontend/shared/ui/components/ResponsiveDialog.tsx`.
 *
 * Drop-in shadcn Dialog replacement. On mobile renders as a bottom Sheet;
 * on desktop renders as a centered Modal. Same API surface.
 */

export {
  ResponsiveDialog,
  ResponsiveDialogRoot,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
  type ResponsiveDialogProps,
  type ResponsiveDialogVariant,
  type ResponsiveDialogSize,
  type ResponsiveDialogMobileVariant,
  type ResponsiveDialogSide,
} from "./components/ResponsiveDialog";
