"use client";

import * as React from "react";
import { motion, type HTMLMotionProps, type Variants } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useHoverLift } from "@/hooks/useHoverLift";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Premium Card Component
 * 
 * Critical comparison to ChatGPT/Claude:
 * 
 * ChatGPT:
 * - Clean white/dark cards with subtle borders
 * - Minimal shadows, flat design
 * - Hover states are subtle (slight background change)
 * - Consistent 8px border radius
 * 
 * Claude:
 * - Softer, more rounded cards (12-16px radius)
 * - Subtle shadows that increase on hover
 * - Glass morphism effects in some areas
 * - Smooth transitions
 * 
 * DocketDive Premium Card:
 * - Glass morphism for premium feel (like Claude)
 * - Lift effect on hover for depth perception
 * - Consistent 12px border radius (--radius-lg)
 * - Smooth 200ms transitions
 * - Interactive cursor for clickable cards
 */

const premiumCardVariants = cva(
  [
    // Base styles
    "relative rounded-lg border transition-all duration-200",
    // Default shadow
    "shadow-md",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-card text-card-foreground",
          "border-border",
        ].join(" "),
        glass: [
          "bg-card/80 backdrop-blur-xl",
          "border-border/50",
          "shadow-lg",
        ].join(" "),
        elevated: [
          "bg-card text-card-foreground",
          "border-border/30",
          "shadow-xl",
        ].join(" "),
        outline: [
          "bg-transparent",
          "border-2 border-border",
          "shadow-none hover:shadow-md",
        ].join(" "),
        ghost: [
          "bg-transparent border-transparent",
          "shadow-none",
          "hover:bg-muted/50",
        ].join(" "),
      },
      padding: {
        none: "p-0",
        sm: "p-3",
        default: "p-4",
        lg: "p-6",
        xl: "p-8",
      },
      radius: {
        sm: "rounded-md",
        default: "rounded-lg",
        lg: "rounded-xl",
        xl: "rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
      radius: "lg",
    },
  }
);

export interface PremiumCardProps
  extends Omit<HTMLMotionProps<"div">, "onAnimationStart" | "onDrag" | "onDragEnd" | "onDragStart">,
    VariantProps<typeof premiumCardVariants> {
  /** Enable hover lift animation */
  hoverLift?: boolean;
  /** Make card interactive (adds cursor pointer) */
  interactive?: boolean;
  /** Custom lift amount in pixels */
  liftAmount?: number;
  /** As child element */
  asChild?: boolean;
}

const PremiumCard = React.forwardRef<HTMLDivElement, PremiumCardProps>(
  (
    {
      className,
      variant,
      padding,
      radius,
      hoverLift = false,
      interactive = false,
      liftAmount = -4,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();
    const { motionVariants, handlers } = useHoverLift({
      lift: liftAmount,
      scale: 1.01,
      shadowIntensity: 1.3,
    });

    const isInteractive = interactive || !!onClick;
    const shouldAnimate = hoverLift && !prefersReducedMotion && motionVariants !== undefined;

    // Create safe variants that always have values
    const safeVariants: Variants = motionVariants ?? {
      initial: {},
      hover: {},
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          premiumCardVariants({ variant, padding, radius }),
          isInteractive && "cursor-pointer",
          className
        )}
        variants={safeVariants}
        initial="initial"
        whileHover={shouldAnimate ? "hover" : "initial"}
        onClick={onClick}
        {...(shouldAnimate ? handlers : {})}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

PremiumCard.displayName = "PremiumCard";

/**
 * Card Header component
 */
const PremiumCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5", className)}
    {...props}
  />
));
PremiumCardHeader.displayName = "PremiumCardHeader";

/**
 * Card Title component
 */
const PremiumCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
PremiumCardTitle.displayName = "PremiumCardTitle";

/**
 * Card Description component
 */
const PremiumCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
PremiumCardDescription.displayName = "PremiumCardDescription";

/**
 * Card Content component
 */
const PremiumCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("pt-0", className)} {...props} />
));
PremiumCardContent.displayName = "PremiumCardContent";

/**
 * Card Footer component
 */
const PremiumCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-4", className)}
    {...props}
  />
));
PremiumCardFooter.displayName = "PremiumCardFooter";

export {
  PremiumCard,
  PremiumCardHeader,
  PremiumCardTitle,
  PremiumCardDescription,
  PremiumCardContent,
  PremiumCardFooter,
  premiumCardVariants,
};
