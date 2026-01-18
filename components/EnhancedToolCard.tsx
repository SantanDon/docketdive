"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useMotionTemplate } from "framer-motion";
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Zap,
  ChevronRight 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ToolIconMedium } from "@/components/ui/tool-icons";

interface ToolCardProps {
  id: string;
  name: string;
  description: string;
  spotlightColor: string;
  href: string;
  index: number;
  isNew?: boolean;
  badge?: string;
}

export function EnhancedToolCard({
  id,
  name,
  description,
  spotlightColor,
  href,
  index,
  isNew = false,
  badge,
}: ToolCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // Mouse position for spotlight effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Smooth spring animation for mouse position
  const springConfig = { damping: 25, stiffness: 150 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);
  
  // Create motion template for gradient
  const background = useMotionTemplate`
    radial-gradient(
      650px circle at ${smoothMouseX}px ${smoothMouseY}px,
      ${spotlightColor},
      transparent 80%
    )
  `;
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      className="group relative"
    >
      <Link href={href} prefetch={true} className="block">
        <motion.div
          layout
          whileHover={{ y: -5, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={cn(
            "relative overflow-hidden rounded-3xl border border-border/40",
            "bg-gradient-to-br from-card via-card to-muted/20",
            "transition-all duration-500",
            "hover:shadow-2xl hover:shadow-primary/10",
            "hover:border-primary/30"
          )}
        >
          {/* Spotlight effect */}
          <motion.div
            className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-300"
            style={{ background }}
            animate={{ opacity: isHovered ? 1 : 0 }}
          />
          
          {/* Animated gradient overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 opacity-0 transition-opacity duration-500"
            animate={{ opacity: isHovered ? 1 : 0 }}
          />
          
          {/* Content */}
          <div className="relative p-8 h-full flex flex-col">
            {/* Header with icon */}
            <div className="flex items-start justify-between gap-4">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className={cn(
                  "relative h-14 w-14 rounded-2xl flex items-center justify-center",
                  "bg-gradient-to-br from-primary/10 to-accent/10",
                  "border border-primary/20",
                  "transition-transform duration-500 group-hover:scale-110"
                )}
              >
                {/* Glow effect */}
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 blur-lg"
                  animate={{ opacity: isHovered ? 0.6 : 0 }}
                  transition={{ duration: 0.3 }}
                />
                <ToolIconMedium toolId={id} />
                
                {/* Status badge */}
                {(isNew || badge) && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={cn(
                      "absolute -top-2 -right-2 h-5 w-5 rounded-full flex items-center justify-center",
                      "bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg"
                    )}
                  >
                    <Zap size={10} className="text-white" />
                  </motion.div>
                )}
              </motion.div>
              
              {/* AI-powered badge */}
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 10 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20"
              >
                <Sparkles size={12} className="text-primary" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                  AI-Powered
                </span>
              </motion.div>
            </div>
            
            {/* Text content */}
            <div className="mt-6 flex-1">
              <motion.h2
                className="text-xl font-bold text-foreground tracking-tight"
                animate={{ color: isHovered ? "hsl(var(--primary))" : "hsl(var(--foreground))" }}
                transition={{ duration: 0.3 }}
              >
                {name}
              </motion.h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                {description}
              </p>
            </div>
            
            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-border/30 flex items-center justify-between">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                <CheckCircle2 size={14} className="text-green-500" />
                <span className="text-xs font-medium text-muted-foreground/70">
                  Free to use
                </span>
              </motion.div>
              
              <motion.div
                whileHover={{ x: 5 }}
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center",
                  "bg-secondary/50 group-hover:bg-primary group-hover:text-primary-foreground",
                  "transition-all duration-300"
                )}
              >
                <ArrowRight size={18} className="transition-transform duration-300" />
              </motion.div>
            </div>
          </div>
          
          {/* Decorative elements */}
          <motion.div
            className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full opacity-0 transition-opacity duration-500"
            animate={{ opacity: isHovered ? 1 : 0 }}
          />
          <motion.div
            className="absolute bottom-0 left-0 h-24 w-24 bg-gradient-to-tr from-accent/5 to-transparent rounded-tr-full opacity-0 transition-opacity duration-500"
            animate={{ opacity: isHovered ? 1 : 0 }}
          />
        </motion.div>
      </Link>
    </motion.div>
  );
}

/**
 * ToolsGrid - Enhanced grid for tool cards with staggered animations
 */
export function ToolsGrid({
  tools,
}: {
  tools: Array<{
    id: string;
    name: string;
    description: string;
    spotlightColor: string;
    href: string;
  }>;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool, index) => (
        <EnhancedToolCard key={tool.id} {...tool} index={index} />
      ))}
    </div>
  );
}

export default EnhancedToolCard;
