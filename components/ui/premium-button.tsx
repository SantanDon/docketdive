"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRipple, type Ripple } from "@/hooks/useRipple";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Premium Button Component
 * 
 * Critical comparison to ChatGPT/Claude:
 * 
 * ChatGPT:
 * - Clean, minimal buttons with subtle hover states
 * - Primary action uses solid fill with slight darkening on hover
 * - Loading states show spinner replacing text
 * - Focus states are subtle but visible
 * 
 * Claude:
 * - Rounded buttons with soft shadows
 * - Gradient accents on primary actions
 * - Smooth transitions (200-300ms)
 * - Clear disabled states
 * 
 * DocketDive Premium Button:
 * - Combines best of both: clean design + premium feel
 * - Adds ripple effect for tactile feedback (Material Design influence)
 * - Subtle glow on hover for depth
 * - Minimum 44px touch target for accessibility
 * - Respects reduced motion preferences
 */

const premiumButtonVariants = cva(
  [
    // Base styles - matching ChatGPT/Claude quality
    "relative inline-flex items-center justify-center gap-2",
    "whitespace-nowrap font-medium",
    "transition-all duration-200 ease-out",
    // Focus ring - accessible and visible
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    // Disabled state
    "disabled:pointer-events-none disabled:opacity-50",
    // SVG handling
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    // Overflow hidden for ripple effect
    "overflow-hidden",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground",
          "shadow-md hover:shadow-lg",
          "hover:bg-primary/90",
          // Subtle glow on hover
          "hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]",
        ].join(" "),
        secondary: [
          "bg-secondary text-secondary-foreground",
          "shadow-sm hover:shadow-md",
          "hover:bg-secondary/80",
        ].join(" "),
        outline: [
          "border-2 border-input bg-background",
          "shadow-sm hover:shadow-md",
          "hover:bg-accent hover:text-accent-foreground",
          "hover:border-accent",
        ].join(" "),
        ghost: [
          "hover:bg-accent/10 hover:text-accent-foreground",
          "active:bg-accent/20",
        ].join(" "),
        destructive: [
          "bg-destructive text-destructive-foreground",
          "shadow-md hover:shadow-lg",
          "hover:bg-destructive/90",
        ].join(" "),
        gradient: [
          "bg-gradient-to-r from-primary to-accent text-primary-foreground",
          "shadow-md hover:shadow-lg",
          "hover:opacity-90",
          "hover:shadow-[0_0_25px_rgba(var(--primary-rgb),0.4)]",
        ].join(" "),
      },
      size: {
        sm: "h-9 min-w-[36px] px-3 text-xs rounded-lg [&_svg]:size-3.5",
        default: "h-10 min-w-[44px] px-4 text-sm rounded-xl [&_svg]:size-4",
        lg: "h-12 min-w-[48px] px-6 text-base rounded-xl [&_svg]:size-5",
        icon: "h-10 w-10 min-h-[44px] min-w-[44px] rounded-xl [&_svg]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface PremiumButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof premiumButtonVariants> {
  /** Render as child component (Radix Slot) */
  asChild?: boolean;
  /** Show loading spinner and disable interactions */
  isLoading?: boolean;
  /** Loading text to display */
  loadingText?: string;
  /** Enable ripple effect on click */
  ripple?: boolean;
  /** Enable glow effect on hover */
  glow?: boolean;
}

/**
 * Ripple element component
 */
function RippleEffect({ ripple }: { ripple: Ripple }) {
  return (
    <motion.span
      key={ripple.id}
      initial={{ scale: 0, opacity: 0.35 }}
      animate={{ scale: 1, opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="absolute rounded-full bg-current pointer-events-none"
      style={{
        left: ripple.x - ripple.size / 2,
        top: ripple.y - ripple.size / 2,
        width: ripple.size,
        height: ripple.size,
      }}
    />
  );
}

const PremiumButton = React.forwardRef<HTMLButtonElement, PremiumButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      loadingText,
      ripple: enableRipple = true,
      glow = true,
      disabled,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const { ripples, createRipple } = useRipple();
    const prefersReducedMotion = useReducedMotion();
    const Comp = asChild ? Slot : "button";

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (enableRipple && !prefersReducedMotion) {
        createRipple(e);
      }
      onClick?.(e);
    };

    const isDisabled = disabled || isLoading;

    return (
      <Comp
        ref={ref}
        className={cn(
          premiumButtonVariants({ variant, size }),
          // Remove glow if disabled or glow is false
          !glow && "hover:shadow-md",
          className
        )}
        disabled={isDisabled}
        onClick={handleClick}
        aria-busy={isLoading}
        aria-disabled={isDisabled}
        {...props}
      >
        {/* Ripple container */}
        <AnimatePresence>
          {ripples.map((ripple) => (
            <RippleEffect key={ripple.id} ripple={ripple} />
          ))}
        </AnimatePresence>

        {/* Loading state */}
        {isLoading ? (
          <>
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Loader2 className="animate-spin" />
            </motion.span>
            {loadingText && (
              <span className="opacity-0">{loadingText}</span>
            )}
            {!loadingText && (
              <span className="opacity-0">{children}</span>
            )}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);

PremiumButton.displayName = "PremiumButton";

export { PremiumButton, premiumButtonVariants };
