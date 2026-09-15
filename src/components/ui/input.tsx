import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm placeholder:text-muted",
        "outline-none focus:border-arkedia-blue focus:ring-2 focus:ring-arkedia-blue/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn("text-sm font-semibold text-foreground", className)}
      {...props}
    />
  );
}

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm placeholder:text-muted",
        "outline-none focus:border-arkedia-blue focus:ring-2 focus:ring-arkedia-blue/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Input, Label, Textarea };
