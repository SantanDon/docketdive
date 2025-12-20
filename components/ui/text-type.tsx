"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export const TextType = ({
  text,
  className,
  cursorClassName,
  speed = 100,
  delay = 0,
}: {
  text: string;
  className?: string;
  cursorClassName?: string;
  speed?: number;
  delay?: number;
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      setStarted(true);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;

    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, started]);

  return (
    <span className={cn("inline-flex items-center", className)}>
      {displayedText}
      <span
        className={cn(
          "ml-1 h-4 w-[2px] animate-blink bg-current",
          cursorClassName
        )}
      />
    </span>
  );
};
