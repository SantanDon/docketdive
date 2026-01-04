"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Spotlight component that adds a cursor-following radial gradient effect.
 * Wrap any card or container with this to give it a "spotlight" feel.
 */
export const Spotlight = ({
  children,
  className = "",
  spotlightColor = "rgba(255, 255, 255, 0.15)",
  as: Component = "div",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  as?: React.ElementType;
  [key: string]: any;
}) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <Component
      className={cn(
        "group relative border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden",
        className
      )}
      onMouseMove={handleMouseMove}
      {...props}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              ${spotlightColor},
              transparent 80%
            )
          `,
        }}
        aria-hidden="true"
      />
      
      <div className="relative h-full">{children}</div>
    </Component>
  );
};
