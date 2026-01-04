"use client";

import { 
  Scale, 
  Sparkles, 
  FileText, 
  FileSearch, 
  Shield, 
  GitCompare,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolIconProps {
  toolId: string;
  size?: number;
  className?: string;
}

const iconMap: Record<string, LucideIcon> = {
  "contract-analysis": Scale,
  "simplify": Sparkles,
  "drafting": FileText,
  "audit": FileSearch,
  "popia": Shield,
  "compare": GitCompare,
};

const colorMap: Record<string, string> = {
  "contract-analysis": "from-blue-600 to-indigo-600",
  "simplify": "from-purple-600 to-indigo-600",
  "drafting": "from-violet-500 to-purple-500",
  "audit": "from-emerald-500 to-teal-500",
  "popia": "from-purple-500 to-indigo-500",
  "compare": "from-cyan-500 to-blue-500",
};

/**
 * Custom rounded tool icons with consistent styling
 * Inspired by Linear.app and Figma icon design
 */
export function ToolIcon({ toolId, size = 24, className }: ToolIconProps) {
  const Icon = iconMap[toolId] || FileText;
  const gradient = colorMap[toolId] || "from-primary to-accent";

  return (
    <div className={cn(
      "rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm",
      gradient,
      className
    )} style={{ width: size, height: size }}>
      <Icon className="text-white" size={size * 0.6} strokeWidth={2.5} />
    </div>
  );
}

/**
 * Large tool icon for headers
 */
export function ToolIconLarge({ toolId }: { toolId: string }) {
  return <ToolIcon toolId={toolId} size={48} className="rounded-2xl shadow-lg" />;
}

/**
 * Medium tool icon for cards
 */
export function ToolIconMedium({ toolId }: { toolId: string }) {
  return <ToolIcon toolId={toolId} size={40} className="rounded-xl shadow-md" />;
}

/**
 * Small tool icon for inline use
 */
export function ToolIconSmall({ toolId }: { toolId: string }) {
  return <ToolIcon toolId={toolId} size={32} className="rounded-lg" />;
}


