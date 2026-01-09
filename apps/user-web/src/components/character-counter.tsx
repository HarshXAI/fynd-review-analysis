"use client";

interface CharacterCounterProps {
  current: number;
  max: number;
  className?: string;
}

export function CharacterCounter({ current, max, className }: CharacterCounterProps) {
  const percentage = (current / max) * 100;
  const isNearLimit = percentage > 80;
  const isAtLimit = current >= max;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1">
        <span
          className={`text-sm font-medium transition-colors ${
            isAtLimit
              ? "text-red-600 dark:text-red-400"
              : isNearLimit
              ? "text-amber-600 dark:text-amber-400"
              : "text-muted-foreground"
          }`}
        >
          {current} / {max}
        </span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ease-out ${
            isAtLimit
              ? "bg-red-500 dark:bg-red-400"
              : isNearLimit
              ? "bg-amber-500 dark:bg-amber-400"
              : "bg-primary"
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
