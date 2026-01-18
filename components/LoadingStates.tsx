"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Loader2, FileText, Scale, Sparkles, Shield, FileSearch, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PremiumSkeleton,
  ShimmerContainer,
  SkeletonCard,
  SkeletonScoreCircle,
  SkeletonStatsRow,
  SkeletonList,
  SkeletonUploadZone,
  SkeletonProgressBar,
  ToolLoadingSkeleton,
  AuditResultsLoading,
} from "@/components/ui/premium-skeleton";

/**
 * LegalLogoSpinner - Premium animated logo spinner for initial load
 * Features:
 * - Scale animation with rotation
 * - Gradient glow effect
 * - Professional legal iconography
 * - Smooth pulsing glow rings
 */
export function LegalLogoSpinner({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeMap = {
    sm: { icon: 32, container: 48, glow: 96 },
    md: { icon: 28, container: 64, glow: 128 },
    lg: { icon: 36, container: 80, glow: 160 },
  };

  const { icon, container, glow } = sizeMap[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        className
      )}
    >
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          rotate: [0, 2, -2, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          willChange: "transform, rotate",
        }}
      >
        <div className="relative">
          {/* Multiple glow layers for depth */}
          <motion.div
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/40 via-accent/30 to-primary/40 blur-2xl"
            animate={{
              opacity: [0.4, 0.7, 0.4],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ width: glow, height: glow }}
          />
          
          {/* Secondary glow */}
          <motion.div
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 blur-xl"
            animate={{
              opacity: [0.3, 0.5, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
            style={{ width: glow, height: glow }}
          />
          
          {/* Main icon container */}
          <div
            className="relative rounded-2xl bg-gradient-to-br from-primary via-primary/95 to-accent flex items-center justify-center shadow-2xl shadow-primary/25 ring-1 ring-white/20"
            style={{ width: container, height: container }}
          >
            <Scale size={icon} className="text-white" />
            
            {/* Subtle inner glow */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          </div>
        </div>
      </motion.div>

      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            DocketDive
          </h1>
          <p className="text-sm text-muted-foreground font-medium tracking-wide">
            Legal AI Assistant
          </p>
        </motion.div>
      </div>

      {/* Animated loading dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center gap-2"
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.div
            key={i}
            className="h-2 w-2 rounded-full bg-primary"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.15,
            }}
            style={{ willChange: "transform, opacity" }}
          />
        ))}
      </motion.div>
    </div>
  );
}

/**
 * ToolLoadingState - Premium loading state for individual tool pages
 * Features:
 * - Tool-specific progress messages
 * - Animated progress ring
 * - Step-by-step progress visualization
 * - Estimated time indicator
 * - Professional legal context
 */
export function ToolLoadingState({
  toolName = "Analyzing Document",
  message = "Processing your legal document...",
  estimatedTime = "~30 seconds",
  progress = 0,
  toolIcon: Icon = FileSearch,
  className,
  showSteps = true,
}: {
  toolName?: string;
  message?: string;
  estimatedTime?: string;
  progress?: number;
  toolIcon?: React.ComponentType<{ size?: number }>;
  className?: string;
  showSteps?: boolean;
}) {
  const steps = [
    { icon: FileText, label: "Extracting", color: "text-blue-500" },
    { icon: Scale, label: "Analyzing", color: "text-purple-500" },
    { icon: Shield, label: "Validating", color: "text-amber-500" },
    { icon: Sparkles, label: "Generating", color: "text-green-500" },
  ];

  const currentStep = Math.min(Math.floor(progress / 25), steps.length - 1);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-6 p-8",
        className
      )}
    >
      {/* Tool icon with progress ring */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="relative"
      >
        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/10">
          <Icon size={36} />
        </div>
        
        {/* Progress ring */}
        <svg
          className="absolute inset-0 h-20 w-20 -rotate-90 transform"
          viewBox="0 0 80 80"
        >
          {/* Background ring */}
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-muted/30"
          />
          {/* Progress ring with gradient */}
          <motion.circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="url(#toolProgressGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="226"
            animate={{
              strokeDashoffset: 226 - (226 * Math.min(progress, 100)) / 100,
            }}
            transition={{ duration: 0.5 }}
            style={{ willChange: "stroke-dashoffset" }}
          />
          <defs>
            <linearGradient
              id="toolProgressGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--accent))" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Loading text */}
      <div className="text-center space-y-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-xl font-semibold text-foreground">
              {toolName}
            </h2>
            <p className="text-sm text-muted-foreground">{message}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress steps */}
      {showSteps && (
        <div className="w-full max-w-sm space-y-3">
          <div className="flex items-center justify-between px-2">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isComplete = index < currentStep;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <motion.div
                    animate={{
                      scale: isActive ? [1, 1.15, 1] : 1,
                      backgroundColor: isComplete
                        ? "hsl(142 76% 36% / 0.2)"
                        : isActive
                        ? "hsl(var(--primary) / 0.15)"
                        : "hsl(var(--muted) / 0.1)",
                      boxShadow: isActive
                        ? "0 0 20px hsl(var(--primary) / 0.3)"
                        : "none",
                    }}
                    className={cn(
                      "h-9 w-9 rounded-xl flex items-center justify-center",
                      "border transition-colors duration-300",
                      isActive && "border-primary/50",
                      isComplete && "border-green-500/30",
                      !isActive && !isComplete && "border-border/50"
                    )}
                  >
                    {isComplete ? (
                      <CheckCircle size={16} className="text-green-500" />
                    ) : (
                      <StepIcon
                        size={16}
                        className={cn(
                          isActive ? "text-primary animate-pulse" : "text-muted-foreground/40"
                        )}
                      />
                    )}
                  </motion.div>
                  <span
                    className={cn(
                      "text-[9px] font-medium uppercase tracking-wider hidden sm:block",
                      isActive && "text-primary",
                      isComplete && "text-green-500/80",
                      !isActive && !isComplete && "text-muted-foreground/40"
                    )}
                  >
                    {step.label}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Animated progress bar */}
          <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%]"
              animate={{
                width: `${Math.min(progress, 100)}%`,
                backgroundPosition: ["0% 0%", "100% 0%"],
              }}
              transition={{
                width: { duration: 0.5 },
                backgroundPosition: { duration: 1.5, repeat: Infinity },
              }}
              style={{ willChange: "width, background-position" }}
            />
          </div>
        </div>
      )}

      {/* Estimated time with icon */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex items-center gap-2 text-xs text-muted-foreground"
      >
        <Loader2 size={12} className="animate-spin" />
        <span>Est. time: {estimatedTime}</span>
      </motion.div>
    </div>
  );
}

/**
 * ToolCardLoadingState - Skeleton state for tool cards
 */
export function ToolCardLoadingState({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <ShimmerContainer className="rounded-3xl border border-border/40 bg-card p-8">
        <div className="flex items-start gap-5">
          <PremiumSkeleton variant="rounded" className="h-14 w-14" />
          <div className="flex-1 space-y-3">
            <PremiumSkeleton className="h-6 w-3/4" />
            <PremiumSkeleton className="h-4 w-1/2" />
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-border/30">
          <div className="flex items-center justify-between">
            <PremiumSkeleton className="h-4 w-24" />
            <PremiumSkeleton variant="rounded" className="h-10 w-10" />
          </div>
        </div>
      </ShimmerContainer>
    </div>
  );
}

/**
 * ResultsLoadingState - Skeleton state for analysis results
 */
export function ResultsLoadingState({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("space-y-8", className)}>
      {/* Score section */}
      <div className="flex items-center justify-center gap-8 p-8 bg-muted/10 rounded-4xl">
        <SkeletonScoreCircle />
        <div className="space-y-3">
          <PremiumSkeleton className="h-8 w-32" />
          <PremiumSkeleton className="h-4 w-24" />
        </div>
      </div>

      {/* Stats row */}
      <SkeletonStatsRow items={4} />

      {/* List section */}
      <div className="space-y-4">
        <PremiumSkeleton className="h-6 w-48" />
        <SkeletonList count={5} />
      </div>
    </div>
  );
}

/**
 * DocumentProcessingState - Loading state for document upload/processing
 */
export function DocumentProcessingState({
  fileName = "document.pdf",
  stage = "uploading",
  progress = 0,
  className,
}: {
  fileName?: string;
  stage?: "uploading" | "processing" | "analyzing" | "complete";
  progress?: number;
  className?: string;
}) {
  const stageMessages = {
    uploading: "Uploading document...",
    processing: "Processing document...",
    analyzing: "Analyzing content...",
    complete: "Analysis complete!",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/40 bg-card p-8 space-y-6",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <motion.div
          animate={{ rotate: stage === "complete" ? 360 : 0 }}
          transition={{ duration: 0.5 }}
          className={cn(
            "h-12 w-12 rounded-xl flex items-center justify-center",
            stage === "complete"
              ? "bg-green-500/20 text-green-500"
              : "bg-primary/20 text-primary"
          )}
        >
          {stage === "complete" ? (
            <Sparkles size={24} />
          ) : (
            <Loader2 size={24} className="animate-spin" />
          )}
        </motion.div>
        <div>
          <p className="font-medium text-foreground">{fileName}</p>
          <p className="text-sm text-muted-foreground">{stageMessages[stage]}</p>
        </div>
      </div>

      <SkeletonProgressBar />

      {stage !== "complete" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-muted-foreground text-center"
        >
          {progress}% complete
        </motion.div>
      )}
    </div>
  );
}

/**
 * ChatLoadingState - Loading state for AI chat responses
 */
export function ChatLoadingState({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex gap-3">
        <PremiumSkeleton variant="circle" className="h-8 w-8" />
        <div className="flex-1 space-y-3">
          <PremiumSkeleton className="h-4 w-20" />
          <ShimmerContainer className="p-4 rounded-2xl bg-muted/20">
            <div className="space-y-2">
              <PremiumSkeleton className="h-4 w-full" />
              <PremiumSkeleton className="h-4 w-5/6" />
              <PremiumSkeleton className="h-4 w-4/5" />
            </div>
          </ShimmerContainer>
        </div>
      </div>
    </div>
  );
}

/**
 * PremiumPageLoader - Main page-level loading component
 * Use this for full-page loading states
 * Features:
 * - Animated legal logo with glow effects
 * - Professional loading message
 * - Backdrop blur for immersion
 * - Responsive design
 */
export function PremiumPageLoader({
  message = "Preparing legal environment...",
  showLogo = true,
  showSubtitle = true,
  className,
}: {
  message?: string;
  showLogo?: boolean;
  showSubtitle?: boolean;
  className?: string;
}) {
  const [currentMessage, setCurrentMessage] = useState(message);

  useEffect(() => {
    const messages = [
      "Preparing legal environment...",
      "Loading legal knowledge base...",
      "Initializing AI models...",
      "Almost ready...",
    ];

    if (message === "Preparing legal environment...") {
      let index = 0;
      const interval = setInterval(() => {
        index = (index + 1) % messages.length;
        setCurrentMessage(messages[index] || "");
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [message]);

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col items-center justify-center gap-8",
        "bg-gradient-to-br from-background via-background to-muted/20",
        className
      )}
    >
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      {showLogo && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <LegalLogoSpinner size="lg" />
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="flex flex-col items-center gap-3 z-10"
      >
        {/* Animated loader with custom icon */}
        <div className="relative">
          <motion.div
            className="h-6 w-6 rounded-full border-2 border-primary/30 border-t-primary"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{ willChange: "transform" }}
          />
          <motion.div
            className="absolute inset-0 h-6 w-6 rounded-full border-2 border-transparent border-t-accent/50"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            style={{ willChange: "transform" }}
          />
        </div>

        <span className="text-sm text-muted-foreground font-medium">
          {currentMessage}
        </span>

        {showSubtitle && (
          <p className="text-xs text-muted-foreground/60 text-center max-w-xs">
            Premium legal AI assistant specializing in South African law
          </p>
        )}
      </motion.div>

      {/* Loading progress indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex items-center gap-1.5 z-10"
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={i}
            className="h-1 w-8 rounded-full bg-primary/20"
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scaleY: [1, 1.5, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.1,
            }}
            style={{ willChange: "transform, opacity" }}
          />
        ))}
      </motion.div>
    </div>
  );
}

/**
 * InlineLoader - Compact loader for small spaces
 */
export function InlineLoader({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeMap = {
    sm: { loader: 16, dot: 2 },
    md: { loader: 20, dot: 3 },
    lg: { loader: 24, dot: 4 },
  };

  const { loader, dot } = sizeMap[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <motion.div
        className="rounded-full border-2 border-primary/30 border-t-primary"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        style={{ width: loader, height: loader, willChange: "transform" }}
      />
      <motion.div
        className="h-1 w-1 rounded-full bg-primary"
        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1, repeat: Infinity }}
      />
    </div>
  );
}

export default {
  LegalLogoSpinner,
  ToolLoadingState,
  ToolCardLoadingState,
  ResultsLoadingState,
  DocumentProcessingState,
  ChatLoadingState,
  PremiumPageLoader,
  InlineLoader,
  PremiumSkeleton,
  ShimmerContainer,
  SkeletonCard,
  SkeletonScoreCircle,
  SkeletonStatsRow,
  SkeletonList,
  SkeletonUploadZone,
  SkeletonProgressBar,
  ToolLoadingSkeleton,
  AuditResultsLoading,
};
