import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "destructive" | "secondary" | "outline";
  className?: string;
}

const variants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/80",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/80",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  outline: "text-foreground border",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
