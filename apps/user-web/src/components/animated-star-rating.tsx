"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimatedStarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  size?: "sm" | "md" | "lg";
}

export function AnimatedStarRating({
  value,
  onChange,
  size = "lg",
}: AnimatedStarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number>(0);

  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = (hoverValue || value) >= star;
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
            className={cn(
              "relative transition-all duration-300 ease-out transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg p-1",
              isActive ? "scale-110" : "scale-100"
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                "transition-all duration-300",
                isActive
                  ? "fill-yellow-400 stroke-yellow-500 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"
                  : "fill-muted stroke-muted-foreground/30"
              )}
            />
            {isActive && (
              <span className="absolute inset-0 animate-ping opacity-20">
                <Star
                  className={cn(
                    sizeClasses[size],
                    "fill-yellow-400 stroke-yellow-500"
                  )}
                />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
