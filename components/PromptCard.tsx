"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Premium Prompt Card Component
 * 
 * Critical comparison to ChatGPT/Claude:
 * 
 * ChatGPT:
 * - Simple cards with icon + text
 * - Subtle hover background change
 * - Clean, minimal design
 * 
 * Claude:
 * - Rounded cards with soft shadows
 * - Hover lift effect
 * - Gradient accents
 * 
 * DocketDive Premium:
 * - Glass morphism background
 * - Lift + glow on hover
 * - Gradient icon background
 * - Staggered entrance animation
 */

interface PromptCardProps {
  icon: LucideIcon;
  title: string;
  prompt: string;
  onClick: () => void;
  delay?: number;
}

export default function PromptCard({
  icon: Icon,
  title,
  prompt,
  onClick,
  delay = 0,
}: PromptCardProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.button
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ 
        delay, 
        duration: prefersReducedMotion ? 0 : 0.3,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      whileHover={prefersReducedMotion ? {} : { 
        y: -3, 
        scale: 1.01,
        transition: { duration: 0.2 }
      }}
      whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "group w-full p-4 text-left",
        // Glass morphism background
        "bg-card/80 backdrop-blur-sm",
        "hover:bg-card/95",
        // Border with hover glow
        "border border-border/50",
        "hover:border-primary/40",
        // Premium shadow
        "shadow-sm hover:shadow-lg",
        "hover:shadow-primary/5",
        // Rounded corners
        "rounded-xl",
        // Transitions
        "transition-all duration-200",
        // Focus and touch
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "min-h-[72px]"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon with gradient background */}
        <div className={cn(
          "flex-shrink-0 h-10 w-10 rounded-lg",
          "bg-gradient-to-br from-primary/15 to-accent/15",
          "flex items-center justify-center",
          "group-hover:from-primary/25 group-hover:to-accent/25",
          "transition-all duration-200",
          "ring-1 ring-primary/10 group-hover:ring-primary/20"
        )}>
          <Icon className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-200" />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <h3 className="font-medium text-sm text-foreground mb-1 group-hover:text-primary transition-colors duration-200">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {prompt}
          </p>
        </div>
        
        {/* Arrow indicator on hover */}
        <motion.div 
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          initial={false}
          animate={{ x: 0 }}
          whileHover={{ x: 2 }}
        >
          <svg 
            className="h-4 w-4 text-primary/60" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </motion.div>
      </div>
    </motion.button>
  );
}
