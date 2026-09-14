import { cn } from "@/lib/utils";

export function Logo({
  className,
  subtitle = true,
  size = "md",
}: {
  className?: string;
  subtitle?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <div className={cn("flex flex-col leading-none select-none", className)}>
      <span
        className={cn(
          "font-extrabold tracking-tight text-[#14213d]",
          sizes[size]
        )}
      >
        ARK
        <span className="text-arkedia-blue">#</span>
        ÈDIA
      </span>
      {subtitle && (
        <span
          className={cn(
            "font-semibold uppercase text-arkedia-blue tracking-[0.2em]",
            size === "lg"
              ? "text-sm mt-1"
              : size === "md"
                ? "text-[10px] mt-0.5"
                : "text-[8px]"
          )}
        >
          Escola de Música
        </span>
      )}
    </div>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl bg-arkedia-blue font-extrabold text-white",
        className
      )}
    >
      #
    </div>
  );
}
