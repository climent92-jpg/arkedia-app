import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-arkedia-blue text-white hover:bg-arkedia-blue-dark",
        secondary:
          "bg-arkedia-blue-light text-arkedia-blue hover:bg-arkedia-blue-light/70",
        outline:
          "border border-border bg-surface text-foreground hover:bg-black/[0.03]",
        ghost: "hover:bg-black/[0.05] text-foreground",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        accent: "bg-arkedia-accent text-white hover:brightness-95",
      },
      size: {
        default: "h-11 px-5 py-2 has-[>svg]:px-4",
        sm: "h-9 px-3.5 text-sm has-[>svg]:px-3",
        lg: "h-13 px-7 text-base has-[>svg]:px-6",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
