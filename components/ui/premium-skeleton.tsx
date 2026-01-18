"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * PremiumSkeleton - Enhanced skeleton loader with shimmer effect
 * Features:
 * - Smooth shimmer animation with gradient
 * - Configurable border radius and sizes
 * - Accessibility support (prefers-reduced-motion)
 * - Performance optimized with will-change
 * - Dark mode support
 */

interface PremiumSkeletonProps {
  className?: string;
  variant?: "rectangle" | "circle" | "rounded" | "pill";
  width?: string | number;
  height?: string | number;
  animation?: "shimmer" | "pulse" | "none";
}

export function PremiumSkeleton({
  className,
  variant = "rectangle",
  width,
  height,
  animation = "shimmer",
}: PremiumSkeletonProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const variantStyles = {
    rectangle: "rounded-none",
    circle: "rounded-full",
    rounded: "rounded-xl",
    pill: "rounded-full",
  };

  const effectiveAnimation = prefersReducedMotion ? "none" : animation;

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gradient-to-r from-muted/40 via-muted/60 to-muted/40",
        variantStyles[variant],
        className
      )}
      style={{ width, height }}
      aria-hidden="true"
    >
      {effectiveAnimation === "shimmer" && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent"
          animate={{
            x: ["-100%", "100%"],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            willChange: "transform",
          }}
        />
      )}
      {effectiveAnimation === "pulse" && (
        <motion.div
          className="absolute inset-0 bg-primary/10"
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            willChange: "opacity",
          }}
        />
      )}
    </div>
  );
}

/**
 * ShimmerContainer - Container with subtle shimmer background
 * Used for loading cards and sections
 * Features glassmorphism effect for premium feel
 */
export function ShimmerContainer({
  children,
  className,
  active = true,
  intensity = "medium",
}: {
  children: React.ReactNode;
  className?: string;
  active?: boolean;
  intensity?: "low" | "medium" | "high";
}) {
  const intensityStyles = {
    low: "via-muted/10",
    medium: "via-muted/20",
    high: "via-muted/40",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-card/50 backdrop-blur-sm",
        active && "animate-pulse",
        className
      )}
    >
      {active && (
        <motion.div
          className={cn(
            "absolute inset-0 bg-gradient-to-r from-transparent",
            intensityStyles[intensity],
            "to-transparent"
          )}
          animate={{
            x: ["-100%", "100%"],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            willChange: "transform",
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/**
 * SkeletonCard - Pre-built skeleton for card-shaped content
 * Perfect for tool cards and result items
 * Enhanced with premium styling
 */
export function SkeletonCard({
  className,
  showHeader = true,
  showContent = true,
  showFooter = true,
  variant = "premium",
}: {
  className?: string;
  showHeader?: boolean;
  showContent?: boolean;
  showFooter?: boolean;
  variant?: "basic" | "premium";
}) {
  if (variant === "basic") {
    return (
      <div
        className={cn(
          "rounded-xl border border-border/40 bg-card p-6",
          className
        )}
      >
        {showHeader && (
          <div className="flex items-start gap-4 mb-4">
            <PremiumSkeleton variant="rounded" className="h-12 w-12" />
            <div className="flex-1 space-y-2">
              <PremiumSkeleton className="h-5 w-3/4" />
              <PremiumSkeleton className="h-4 w-1/2" />
            </div>
          </div>
        )}
        
        {showContent && (
          <div className="space-y-3">
            <PremiumSkeleton className="h-4 w-full" />
            <PremiumSkeleton className="h-4 w-5/6" />
            <PremiumSkeleton className="h-4 w-4/5" />
          </div>
        )}
        
        {showFooter && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/40">
            <PremiumSkeleton className="h-8 w-24" />
            <PremiumSkeleton variant="rounded" className="h-10 w-10" />
          </div>
        )}
      </div>
    );
  }

  // Premium variant with enhanced styling
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/80 p-6 shadow-lg shadow-primary/5",
        className
      )}
    >
      {showHeader && (
        <div className="flex items-start gap-4 mb-6">
          <PremiumSkeleton
            variant="rounded"
            className="h-14 w-14 shadow-md"
          />
          <div className="flex-1 space-y-3">
            <PremiumSkeleton className="h-6 w-3/4" />
            <PremiumSkeleton className="h-4 w-1/2" />
            <div className="flex gap-2">
              <PremiumSkeleton variant="pill" className="h-5 w-16" />
              <PremiumSkeleton variant="pill" className="h-5 w-20" />
            </div>
          </div>
        </div>
      )}
      
      {showContent && (
        <div className="space-y-4">
          <PremiumSkeleton className="h-4 w-full" />
          <PremiumSkeleton className="h-4 w-5/6" />
          <PremiumSkeleton className="h-4 w-4/5" />
          <PremiumSkeleton className="h-20 w-full rounded-xl" />
        </div>
      )}
      
      {showFooter && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/40">
          <div className="flex gap-2">
            <PremiumSkeleton variant="rounded" className="h-10 w-28" />
            <PremiumSkeleton variant="rounded" className="h-10 w-28" />
          </div>
          <PremiumSkeleton variant="rounded" className="h-10 w-10" />
        </div>
      )}
    </div>
  );
}

/**
 * SkeletonScoreCircle - Skeleton for score/circle visualizations
 * Features animated ring effect
 */
export function SkeletonScoreCircle({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeMap = {
    sm: 80,
    md: 128,
    lg: 160,
  };

  const dimensions = sizeMap[size];

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      {/* Outer ring */}
      <PremiumSkeleton
        variant="circle"
        className={`h-${dimensions} w-${dimensions} border-4 border-muted/50`}
      />
      
      {/* Inner content placeholder */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="space-y-2 text-center">
          <PremiumSkeleton className="h-8 w-16 mx-auto" />
          <PremiumSkeleton variant="pill" className="h-3 w-20 mx-auto" />
        </div>
      </div>
    </div>
  );
}

/**
 * SkeletonStatsRow - Skeleton for statistics dashboard rows
 * Enhanced with gradient backgrounds
 */
export function SkeletonStatsRow({
  items = 4,
  className,
}: {
  items?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4", className)} style={{ 
      gridTemplateColumns: `repeat(${items}, minmax(0, 1fr))` 
    }}>
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "p-6 rounded-2xl bg-gradient-to-br from-muted/20 to-muted/10",
            "border border-border/40 backdrop-blur-sm",
            "transition-all duration-300"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <PremiumSkeleton className="h-4 w-20" />
            <PremiumSkeleton variant="rounded" className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <PremiumSkeleton className="h-8 w-16" />
            <PremiumSkeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * SkeletonList - Skeleton for expandable list items
 * Features status indicator placeholders
 */
export function SkeletonList({
  count = 5,
  className,
  expandable = true,
}: {
  count?: number;
  className?: string;
  expandable?: boolean;
}) {
  const statusColors = ["bg-green-500/20", "bg-amber-500/20", "bg-red-500/20", "bg-blue-500/20"];

  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "rounded-2xl overflow-hidden border border-border/40",
            "bg-gradient-to-br from-card/80 to-card/60",
            "transition-all duration-300"
          )}
        >
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <PremiumSkeleton
                variant="rounded"
                className={cn("h-12 w-12", statusColors[i % statusColors.length])}
              />
              <div className="space-y-2">
                <PremiumSkeleton className="h-5 w-40" />
                <div className="flex gap-2">
                  <PremiumSkeleton variant="pill" className="h-5 w-16" />
                  <PremiumSkeleton variant="pill" className="h-5 w-20" />
                  <PremiumSkeleton variant="pill" className="h-5 w-12" />
                </div>
              </div>
            </div>
            {expandable && (
              <PremiumSkeleton variant="rounded" className="h-8 w-8" />
            )}
          </div>
          {expandable && i % 2 === 0 && (
            <div className="border-t border-border/40 p-5 space-y-3 bg-muted/10">
              <PremiumSkeleton className="h-4 w-full" />
              <PremiumSkeleton className="h-4 w-5/6" />
              <PremiumSkeleton className="h-4 w-3/4" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * SkeletonTextArea - Skeleton for textarea content
 * Enhanced with better visual hierarchy
 */
export function SkeletonTextArea({
  lines = 6,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3 p-4 rounded-xl bg-muted/20 border border-border/30", className)}>
      <div className="flex justify-between mb-2">
        <PremiumSkeleton className="h-4 w-24" />
        <PremiumSkeleton className="h-4 w-16" />
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <PremiumSkeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 ? "w-2/3" : "w-full"
          )}
        />
      ))}
    </div>
  );
}

/**
 * SkeletonUploadZone - Skeleton for document upload zone
 * Features drag-drop visualization
 */
export function SkeletonUploadZone({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border-2 border-dashed border-border/50 p-10",
        "bg-gradient-to-br from-muted/20 to-muted/10",
        "flex flex-col items-center justify-center gap-4",
        className
      )}
    >
      <div className="relative">
        <PremiumSkeleton variant="rounded" className="h-16 w-16" />
        <div className="absolute -bottom-1 -right-1">
          <PremiumSkeleton variant="circle" className="h-6 w-6" />
        </div>
      </div>
      <div className="text-center space-y-2">
        <PremiumSkeleton className="h-6 w-56 mx-auto" />
        <PremiumSkeleton className="h-4 w-40 mx-auto" />
      </div>
      <div className="flex gap-3">
        <PremiumSkeleton variant="rounded" className="h-10 w-28" />
        <PremiumSkeleton variant="rounded" className="h-10 w-28" />
      </div>
    </div>
  );
}

/**
 * SkeletonProgressBar - Animated progress bar skeleton
 * Features gradient animation
 */
export function SkeletonProgressBar({
  className,
  showLabels = true,
}: {
  className?: string;
  showLabels?: boolean;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {showLabels && (
        <div className="flex justify-between">
          <PremiumSkeleton className="h-4 w-20" />
          <PremiumSkeleton className="h-4 w-12" />
        </div>
      )}
      <div className="h-3 bg-muted/50 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary/40 via-accent/40 to-primary/40 rounded-full"
          animate={{
            backgroundPosition: ["0% 0%", "100% 0%"],
            width: ["20%", "70%", "45%", "90%", "60%"],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            willChange: "width, background-position",
            backgroundSize: "200% 100%",
          }}
        />
      </div>
    </div>
  );
}

/**
 * SkeletonBadge - Skeleton for status badges
 */
export function SkeletonBadge({
  className,
}: {
  className?: string;
}) {
  return (
    <PremiumSkeleton
      variant="pill"
      className={cn("h-6 w-20", className)}
    />
  );
}

/**
 * SkeletonChart - Skeleton for chart/area visualizations
 */
export function SkeletonChart({
  className,
  lines = 4,
}: {
  className?: string;
  lines?: number;
}) {
  return (
    <div className={cn("rounded-2xl p-6 border border-border/40 bg-card/50", className)}>
      <div className="flex justify-between mb-6">
        <PremiumSkeleton className="h-6 w-32" />
        <div className="flex gap-2">
          <PremiumSkeleton variant="pill" className="h-6 w-16" />
          <PremiumSkeleton variant="pill" className="h-6 w-16" />
        </div>
      </div>
      <div className="space-y-4">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <PremiumSkeleton className="h-4 w-16" />
            <div className="flex-1 h-10 bg-muted/30 rounded-lg overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary/30 to-accent/30 rounded-lg"
                animate={{
                  width: [`${25 + i * 15}%`, `${55 + i * 10}%`, `${35 + i * 15}%`, `${65 + i * 8}%`],
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                style={{ willChange: "width" }}
              />
            </div>
            <PremiumSkeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Complete Tool Loading Skeleton
 * Comprehensive loading state for legal tool pages
 */
export function ToolLoadingSkeleton({
  toolName = "Tool",
}: {
  toolName?: string;
}) {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header */}
      <div className="flex items-start gap-6">
        <PremiumSkeleton variant="rounded" className="h-16 w-16" />
        <div className="space-y-3 flex-1">
          <PremiumSkeleton className="h-8 w-64" />
          <PremiumSkeleton className="h-5 w-96" />
          <div className="flex gap-2">
            <PremiumSkeleton variant="pill" className="h-6 w-24" />
            <PremiumSkeleton variant="pill" className="h-6 w-32" />
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <SkeletonStatsRow items={4} />

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <PremiumSkeleton className="h-5 w-32" />
            <PremiumSkeleton variant="pill" className="h-6 w-20" />
          </div>
          <SkeletonTextArea lines={8} />
          <SkeletonUploadZone />
        </div>
        <div className="space-y-4">
          <SkeletonCard variant="premium" />
          <SkeletonCard variant="premium" />
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        <PremiumSkeleton className="h-6 w-48" />
        <SkeletonList count={4} />
      </div>
    </div>
  );
}

/**
 * Audit Results Loading Skeleton
 * Specialized loading state for audit/compliance results
 */
export function AuditResultsLoading({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("space-y-6 animate-pulse", className)}>
      <div className="flex items-center justify-between">
        <PremiumSkeleton className="h-6 w-56" />
        <SkeletonBadge />
      </div>

      <div className="flex flex-col md:flex-row items-center gap-8 p-6 rounded-3xl bg-gradient-to-br from-muted/20 to-muted/10 border border-border/40">
        <SkeletonScoreCircle size="lg" />
        <div className="flex-1 w-full space-y-4">
          <SkeletonStatsRow items={3} />
        </div>
      </div>

      <div className="space-y-4">
        <PremiumSkeleton className="h-6 w-64" />
        <SkeletonList count={5} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl p-4 border border-border/30 bg-muted/20">
          <PremiumSkeleton className="h-5 w-40 mb-4" />
          <SkeletonProgressBar />
        </div>
        <div className="rounded-xl p-4 border border-border/30 bg-muted/20">
          <PremiumSkeleton className="h-5 w-40 mb-4" />
          <SkeletonProgressBar />
        </div>
      </div>
    </div>
  );
}

export default {
  PremiumSkeleton,
  ShimmerContainer,
  SkeletonCard,
  SkeletonScoreCircle,
  SkeletonStatsRow,
  SkeletonList,
  SkeletonTextArea,
  SkeletonUploadZone,
  SkeletonProgressBar,
  SkeletonBadge,
  SkeletonChart,
  ToolLoadingSkeleton,
  AuditResultsLoading,
};
