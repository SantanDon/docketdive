"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.2 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "group w-full p-4 text-left",
        "bg-card hover:bg-muted/50",
        "border border-border hover:border-primary/30",
        "rounded-xl transition-all duration-fast",
        "focus-ring min-h-touch"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-foreground mb-0.5">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {prompt}
          </p>
        </div>
      </div>
    </motion.button>
  );
}
