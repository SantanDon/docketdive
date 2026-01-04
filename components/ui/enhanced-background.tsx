"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

/**
 * Clean, Minimal Background
 * - Simple, professional aesthetic inspired by open-webui
 * - Smooth theme transitions
 * - No distracting patterns or effects
 */
export const EnhancedBackground = ({
  children,
  className,
  interactive = false,
}: {
  children?: React.ReactNode;
  className?: string;
  interactive?: boolean;
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div 
      className={cn("relative min-h-screen w-full bg-background transition-colors duration-300", className)}
    >
      {/* Simple, clean background - just use CSS background color */}
      {/* Subtle gradient overlay for depth - very minimal */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20 dark:to-muted/10 transition-colors duration-300" />
      
      {/* Single subtle animated orb - much more minimal */}
      {mounted && (
        <motion.div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.03] dark:opacity-[0.02] blur-[100px] pointer-events-none"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
          }}
          animate={{
            x: [0, 50, 0],
            y: [0, 50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Content layer */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

/**
 * Animated gradient border component
 */
export const GradientBorder = ({
  children,
  className,
  duration = 3,
}: {
  children: React.ReactNode;
  className?: string;
  duration?: number;
}) => {
  return (
    <div className={cn("relative group", className)}>
      <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 opacity-50 blur transition duration-1000 group-hover:opacity-75" />
      <div className="relative rounded-xl bg-white dark:bg-slate-950">{children}</div>
    </div>
  );
};

/**
 * Floating particles background
 */
export const ParticleBackground = ({
  count = 20,
  className,
}: {
  count?: number;
  className?: string;
}) => {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 10 + 10,
    delay: Math.random() * 5,
  }));

  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-blue-500/10 dark:bg-blue-400/5"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, 50, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: particle.delay,
          }}
        />
      ))}
    </div>
  );
};

export default EnhancedBackground;
