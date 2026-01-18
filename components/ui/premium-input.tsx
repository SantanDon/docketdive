"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, Check, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Premium Input Component with Floating Label
 * 
 * Critical comparison to ChatGPT/Claude:
 * 
 * ChatGPT:
 * - Clean, minimal input fields
 * - Placeholder text that disappears on focus
 * - Subtle border that highlights on focus
 * - Error states with red border
 * 
 * Claude:
 * - Rounded inputs with soft shadows
 * - Labels above inputs (not floating)
 * - Clear focus states with ring
 * - Smooth transitions
 * 
 * DocketDive Premium Input:
 * - Floating label animation (Material Design influence)
 * - Label stays floating when input has value
 * - Error state with red border AND error message
 * - Success state with green checkmark
 * - 200ms transitions for all state changes
 * - Disabled state with reduced opacity
 * - Password visibility toggle
 */

const premiumInputVariants = cva(
  [
    "relative w-full",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "",
        default: "",
        lg: "",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

const inputSizeClasses = {
  sm: "h-9 text-sm px-3 pt-4 pb-1",
  default: "h-12 text-base px-4 pt-5 pb-2",
  lg: "h-14 text-lg px-5 pt-6 pb-2",
};

const labelSizeClasses = {
  sm: {
    default: "text-sm top-2.5 left-3",
    floating: "text-xs top-1 left-3",
  },
  default: {
    default: "text-base top-3.5 left-4",
    floating: "text-xs top-1.5 left-4",
  },
  lg: {
    default: "text-lg top-4 left-5",
    floating: "text-xs top-2 left-5",
  },
};

export interface PremiumInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof premiumInputVariants> {
  /** Floating label text */
  label: string;
  /** Error message to display */
  error?: string;
  /** Success state */
  success?: boolean;
  /** Helper text below input */
  helperText?: string;
  /** Show character count */
  showCount?: boolean;
  /** Left icon */
  leftIcon?: React.ReactNode;
  /** Right icon */
  rightIcon?: React.ReactNode;
  /** Container className */
  containerClassName?: string;
}

const PremiumInput = React.forwardRef<HTMLInputElement, PremiumInputProps>(
  (
    {
      className,
      containerClassName,
      size = "default",
      type = "text",
      label,
      error,
      success,
      helperText,
      showCount,
      maxLength,
      leftIcon,
      rightIcon,
      disabled,
      value,
      defaultValue,
      onChange,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState(defaultValue || "");
    const prefersReducedMotion = useReducedMotion();

    // Determine if input has value (controlled or uncontrolled)
    const hasValue = value !== undefined 
      ? String(value).length > 0 
      : String(internalValue).length > 0;
    
    const currentValue = value !== undefined ? value : internalValue;
    const isFloating = isFocused || hasValue;
    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (value === undefined) {
        setInternalValue(e.target.value);
      }
      onChange?.(e);
    };

    const sizeClass = inputSizeClasses[size || "default"];
    const labelClass = labelSizeClasses[size || "default"];

    return (
      <div className={cn(premiumInputVariants({ size }), containerClassName)}>
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10">
              {leftIcon}
            </div>
          )}

          {/* Input Field */}
          <input
            ref={ref}
            type={inputType}
            value={value}
            defaultValue={defaultValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            maxLength={maxLength}
            className={cn(
              // Base styles
              "w-full rounded-xl border bg-background",
              "transition-all duration-200 ease-out",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              // Size
              sizeClass,
              // Left icon padding
              leftIcon && "pl-10",
              // Right icon/password padding
              (rightIcon || isPassword) && "pr-10",
              // States
              error
                ? "border-destructive focus:ring-destructive/30 focus:border-destructive"
                : success
                ? "border-green-500 focus:ring-green-500/30 focus:border-green-500"
                : "border-input focus:ring-ring/30 focus:border-ring",
              // Disabled
              disabled && "opacity-50 cursor-not-allowed bg-muted",
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${props.id}-error` : undefined}
            {...props}
          />

          {/* Floating Label */}
          <motion.label
            initial={false}
            animate={{
              y: isFloating ? 0 : 0,
              scale: isFloating ? 0.85 : 1,
              x: isFloating ? (leftIcon ? -28 : 0) : 0,
            }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }}
            className={cn(
              "absolute pointer-events-none origin-left",
              "transition-colors duration-200",
              isFloating ? labelClass.floating : labelClass.default,
              leftIcon && !isFloating && "left-10",
              // Color states
              error
                ? "text-destructive"
                : isFocused
                ? "text-primary"
                : "text-muted-foreground",
              disabled && "text-muted-foreground/50"
            )}
          >
            {label}
          </motion.label>

          {/* Right Icon / Password Toggle / Success/Error Icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring rounded"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}
            {error && !isPassword && (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
            {success && !error && !isPassword && (
              <Check className="h-4 w-4 text-green-500" />
            )}
            {rightIcon && !error && !success && !isPassword && rightIcon}
          </div>
        </div>

        {/* Helper Text / Error Message / Character Count */}
        <AnimatePresence mode="wait">
          {(error || helperText || showCount) && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.15 }}
              className="flex justify-between mt-1.5 px-1"
            >
              {error ? (
                <p
                  id={`${props.id}-error`}
                  className="text-xs text-destructive"
                  role="alert"
                >
                  {error}
                </p>
              ) : helperText ? (
                <p className="text-xs text-muted-foreground">{helperText}</p>
              ) : (
                <span />
              )}
              {showCount && maxLength && (
                <span className="text-xs text-muted-foreground">
                  {String(currentValue).length}/{maxLength}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

PremiumInput.displayName = "PremiumInput";

export { PremiumInput, premiumInputVariants };
