"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export type ResponsiveDialogVariant = "modal" | "panel" | "alert";
export type ResponsiveDialogSize = "sm" | "md" | "lg" | "xl" | "full";
export type ResponsiveDialogMobileVariant = "drawer-bottom" | "drawer-right";
export type ResponsiveDialogSide = "left" | "right" | "top" | "bottom";

interface ResponsiveDialogContextValue {
  variant: ResponsiveDialogVariant;
  size: ResponsiveDialogSize;
  isMobile: boolean;
}

const ResponsiveDialogContext = React.createContext<ResponsiveDialogContextValue | null>(null);

function useResponsiveDialogContext(componentName: string): ResponsiveDialogContextValue {
  const ctx = React.useContext(ResponsiveDialogContext);
  if (!ctx) {
    throw new Error(
      `<ResponsiveDialog.${componentName}> must be rendered inside <ResponsiveDialog>`,
    );
  }
  return ctx;
}

const SIZE_DESKTOP_WIDTH: Record<ResponsiveDialogSize, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
  full: "sm:max-w-[95vw]",
};

const SIZE_DESKTOP_HEIGHT: Record<ResponsiveDialogSize, string> = {
  sm: "max-h-[60vh]",
  md: "max-h-[70vh]",
  lg: "max-h-[80vh]",
  xl: "h-[80vh]",
  full: "h-[90vh]",
};

export interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: ResponsiveDialogVariant;
  size?: ResponsiveDialogSize;
  mobileVariant?: ResponsiveDialogMobileVariant;
  sheetSide?: ResponsiveDialogSide;
  showCloseButton?: boolean;
  dismissible?: boolean;
  contentClassName?: string;
  children: React.ReactNode;
}

function ResponsiveDialogRoot({
  open,
  onOpenChange,
  variant = "modal",
  size = "md",
  mobileVariant = "drawer-bottom",
  sheetSide = "right",
  showCloseButton = true,
  dismissible = true,
  contentClassName,
  children,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile();

  const contextValue = React.useMemo<ResponsiveDialogContextValue>(
    () => ({ variant, size, isMobile }),
    [variant, size, isMobile],
  );

  if (isMobile) {
    const direction: "bottom" | "right" = mobileVariant === "drawer-right" ? "right" : "bottom";
    const mobileHeight = direction === "bottom" ? "h-[90dvh] max-h-[90dvh]" : "h-full";
    return (
      <ResponsiveDialogContext.Provider value={contextValue}>
        <Drawer
          open={open}
          onOpenChange={onOpenChange}
          direction={direction}
          dismissible={dismissible}
        >
          <DrawerContent
            className={cn(
              "flex flex-col gap-0 p-0",
              direction === "bottom"
                ? "rounded-t-[1.25rem] border-x-0 border-b-0"
                : "w-full max-w-[95vw] sm:max-w-md",
              mobileHeight,
              contentClassName,
            )}
          >
            {children}
          </DrawerContent>
        </Drawer>
      </ResponsiveDialogContext.Provider>
    );
  }

  if (variant === "alert") {
    return (
      <ResponsiveDialogContext.Provider value={contextValue}>
        <AlertDialog open={open} onOpenChange={onOpenChange}>
          <AlertDialogContent
            className={cn(
              "flex flex-col gap-0 overflow-hidden p-0",
              SIZE_DESKTOP_WIDTH[size],
              contentClassName,
            )}
          >
            {children}
          </AlertDialogContent>
        </AlertDialog>
      </ResponsiveDialogContext.Provider>
    );
  }

  if (variant === "panel") {
    return (
      <ResponsiveDialogContext.Provider value={contextValue}>
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent
            side={sheetSide}
            className={cn(
              "flex h-full w-full max-w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg",
              contentClassName,
            )}
          >
            {children}
          </SheetContent>
        </Sheet>
      </ResponsiveDialogContext.Provider>
    );
  }

  return (
    <ResponsiveDialogContext.Provider value={contextValue}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={showCloseButton}
          className={cn(
            "flex flex-col gap-0 overflow-hidden p-0",
            SIZE_DESKTOP_WIDTH[size],
            SIZE_DESKTOP_HEIGHT[size],
            contentClassName,
          )}
        >
          {children}
        </DialogContent>
      </Dialog>
    </ResponsiveDialogContext.Provider>
  );
}

export interface ResponsiveDialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function ResponsiveDialogHeader({ className, children, ...props }: ResponsiveDialogHeaderProps) {
  const { variant, isMobile } = useResponsiveDialogContext("Header");

  const baseClasses = "shrink-0 border-b text-left";

  if (isMobile) {
    return (
      <DrawerHeader
        className={cn(baseClasses, "gap-1.5 px-5 pb-3 pt-3 md:text-left", className)}
        {...props}
      >
        {children}
      </DrawerHeader>
    );
  }

  if (variant === "alert") {
    return (
      <AlertDialogHeader className={cn(baseClasses, "gap-1.5 px-6 pb-4 pt-6", className)} {...props}>
        {children}
      </AlertDialogHeader>
    );
  }

  if (variant === "panel") {
    return (
      <SheetHeader className={cn(baseClasses, "gap-1.5 px-6 pb-4 pt-6", className)} {...props}>
        {children}
      </SheetHeader>
    );
  }

  return (
    <DialogHeader className={cn(baseClasses, "gap-1.5 px-6 pb-4 pt-6", className)} {...props}>
      {children}
    </DialogHeader>
  );
}

export interface ResponsiveDialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

function ResponsiveDialogTitle({ className, children, ...props }: ResponsiveDialogTitleProps) {
  const { variant, isMobile } = useResponsiveDialogContext("Title");

  if (isMobile) {
    return <DrawerTitle className={className} {...props}>{children}</DrawerTitle>;
  }
  if (variant === "alert") {
    return <AlertDialogTitle className={className} {...props}>{children}</AlertDialogTitle>;
  }
  if (variant === "panel") {
    return <SheetTitle className={className} {...props}>{children}</SheetTitle>;
  }
  return <DialogTitle className={className} {...props}>{children}</DialogTitle>;
}

export interface ResponsiveDialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

function ResponsiveDialogDescription({
  className,
  children,
  ...props
}: ResponsiveDialogDescriptionProps) {
  const { variant, isMobile } = useResponsiveDialogContext("Description");

  if (isMobile) {
    return <DrawerDescription className={className} {...props}>{children}</DrawerDescription>;
  }
  if (variant === "alert") {
    return <AlertDialogDescription className={className} {...props}>{children}</AlertDialogDescription>;
  }
  if (variant === "panel") {
    return <SheetDescription className={className} {...props}>{children}</SheetDescription>;
  }
  return <DialogDescription className={className} {...props}>{children}</DialogDescription>;
}

export interface ResponsiveDialogBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function ResponsiveDialogBody({ className, children, ...props }: ResponsiveDialogBodyProps) {
  useResponsiveDialogContext("Body");
  return (
    <div
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 py-4 sm:px-6",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface ResponsiveDialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function ResponsiveDialogFooter({ className, children, ...props }: ResponsiveDialogFooterProps) {
  const { variant, isMobile } = useResponsiveDialogContext("Footer");

  const baseClasses = "shrink-0 border-t";

  if (isMobile) {
    return (
      <DrawerFooter
        className={cn(baseClasses, "flex-col gap-2 px-5 pb-5 pt-3", className)}
        {...props}
      >
        {children}
      </DrawerFooter>
    );
  }

  if (variant === "alert") {
    return (
      <AlertDialogFooter
        className={cn(baseClasses, "gap-2 px-6 pb-5 pt-4 sm:justify-end", className)}
        {...props}
      >
        {children}
      </AlertDialogFooter>
    );
  }

  if (variant === "panel") {
    return (
      <SheetFooter
        className={cn(baseClasses, "mt-0 flex-row justify-end gap-2 px-6 pb-5 pt-4", className)}
        {...props}
      >
        {children}
      </SheetFooter>
    );
  }

  return (
    <DialogFooter
      className={cn(baseClasses, "gap-2 px-6 pb-5 pt-4 sm:justify-end", className)}
      {...props}
    >
      {children}
    </DialogFooter>
  );
}

type ResponsiveDialogComponent = typeof ResponsiveDialogRoot & {
  Header: typeof ResponsiveDialogHeader;
  Title: typeof ResponsiveDialogTitle;
  Description: typeof ResponsiveDialogDescription;
  Body: typeof ResponsiveDialogBody;
  Footer: typeof ResponsiveDialogFooter;
};

export const ResponsiveDialog = ResponsiveDialogRoot as ResponsiveDialogComponent;
ResponsiveDialog.Header = ResponsiveDialogHeader;
ResponsiveDialog.Title = ResponsiveDialogTitle;
ResponsiveDialog.Description = ResponsiveDialogDescription;
ResponsiveDialog.Body = ResponsiveDialogBody;
ResponsiveDialog.Footer = ResponsiveDialogFooter;

export {
  ResponsiveDialogRoot,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
};
