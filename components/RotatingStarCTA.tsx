"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface RotatingStarCTAProps {
  href?: string;
  className?: string;
}

/**
 * Premium Rotating Star CTA
 * - Slowly rotates to catch attention
 * - Links to the primary tool (Drafting Assistant)
 * - Premium glassmorphism styling
 */
export default function RotatingStarCTA({ 
  href = "https://form.typeform.com/to/ZwVyutgQ",
  className 
}: RotatingStarCTAProps) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "fixed bottom-24 right-6 z-40 p-3 rounded-full",
        "bg-background/80 backdrop-blur-md border border-primary/20 shadow-lg shadow-primary/10",
        "group hover:border-primary/50 transition-all duration-300",
        className
      )}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="text-primary group-hover:text-amber-500 transition-colors"
        >
          <Star size={24} fill="currentColor" className="opacity-20" />
          <Star size={24} className="absolute inset-0" />
        </motion.div>
        
        {/* Pulsing indicator */}
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
        </span>
      </div>

      {/* Tooltip on hover */}
      <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
        Share Feedback
      </div>
    </motion.a>
  );
}
