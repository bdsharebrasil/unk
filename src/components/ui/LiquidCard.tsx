import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LiquidCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  morph?: boolean;
  onClick?: () => void;
}

export function LiquidCard({ 
  children, 
  className, 
  hover = true, 
  morph = false,
  onClick 
}: LiquidCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "liquid-glass rounded-2xl p-6",
        hover && "cursor-pointer",
        morph && "animate-liquid-morph",
        className
      )}
    >
      {children}
    </div>
  );
}

interface LiquidGridProps {
  children: ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4;
}

export function LiquidGrid({ children, className, cols = 3 }: LiquidGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
  };

  return (
    <div className={cn("grid gap-6", gridCols[cols], className)}>
      {children}
    </div>
  );
}
