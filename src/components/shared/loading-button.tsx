// PrintCardFlow — Loading button (shadcn Button wrapper with loading state).
"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type LoadingButtonProps = React.ComponentProps<typeof Button> & {
  loading?: boolean;
  loadingText?: string;
};

export const LoadingButton = React.forwardRef<
  HTMLButtonElement,
  LoadingButtonProps
>(({ loading, loadingText, children, disabled, className, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading}
      className={cn(className)}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {loading && loadingText ? loadingText : children}
    </Button>
  );
});
LoadingButton.displayName = "LoadingButton";
