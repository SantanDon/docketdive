"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Wrench,
  FileSearch,
  Shield,
  GitCompare,
  FileText,
  Gavel,
  ChevronRight,
  Scale,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

/**
 * Premium Tools Menu Component
 * 
 * Critical comparison to ChatGPT/Claude:
 * 
 * ChatGPT:
 * - Simple dropdown with tool list
 * - Icons with labels
 * - Clean hover states
 * 
 * Claude:
 * - Categorized tool sections
 * - Subtle animations
 * - Gradient accents
 * 
 * DocketDive Premium:
 * - Categorized by Analysis, Drafting, Compliance
 * - Staggered entrance animations
 * - Gradient icon backgrounds
 * - Glass morphism dropdown
 * - Premium hover highlighting
 */

// ============================================
// Tool Definitions
// ============================================

const tools = [
  {
    id: "contract-analysis",
    name: "Contract Analyzer",
    description: "Multi-perspective contract risk analysis",
    icon: Scale,
    color: "from-blue-600 to-indigo-600",
    href: "/tools/contract-analysis",
    category: "analysis",
  },
  {
    id: "simplify",
    name: "Document Simplifier",
    description: "Convert legal jargon to plain language",
    icon: Sparkles,
    color: "from-purple-600 to-indigo-600",
    href: "/tools/simplify",
    category: "analysis",
  },
  {
    id: "drafting",
    name: "Drafting Assistant",
    description: "Generate legal documents with AI",
    icon: FileText,
    color: "from-violet-500 to-purple-500",
    href: "/tools/drafting",
    category: "drafting",
  },
  {
    id: "audit",
    name: "Clause Auditor",
    description: "Check contracts for missing clauses",
    icon: FileSearch,
    color: "from-emerald-500 to-teal-500",
    href: "/tools/audit",
    category: "analysis",
  },
  {
    id: "popia",
    name: "POPIA Checker",
    description: "Check POPIA compliance",
    icon: Shield,
    color: "from-purple-500 to-indigo-500",
    href: "/tools/popia",
    category: "compliance",
  },
  {
    id: "compare",
    name: "Document Compare",
    description: "Compare two document versions",
    icon: GitCompare,
    color: "from-cyan-500 to-blue-500",
    href: "/tools/compare",
    category: "analysis",
  },
];

// ============================================
// Tool Item Component
// ============================================

interface ToolItemProps {
  tool: typeof tools[0];
  index: number;
  baseDelay: number;
  onSelect: (href: string) => void;
  prefersReducedMotion: boolean;
}

function ToolItem({ tool, index, baseDelay, onSelect, prefersReducedMotion }: ToolItemProps) {
  const Icon = tool.icon;
  
  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -10 }}
      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
      transition={{ 
        delay: prefersReducedMotion ? 0 : baseDelay + index * 0.05, 
        duration: prefersReducedMotion ? 0 : 0.2 
      }}
    >
      <DropdownMenuItem
        onSelect={() => onSelect(tool.href)}
        className={cn(
          "!cursor-pointer !p-3 !rounded-xl",
          "hover:!bg-primary/5 focus:!bg-primary/5",
          "dark:hover:!bg-primary/10 dark:focus:!bg-primary/10",
          "transition-all duration-200 group",
          "min-h-[56px]"
        )}
      >
        <div className={cn(
          "p-2 rounded-lg bg-gradient-to-br mr-3 shadow-sm",
          "group-hover:shadow-md group-hover:scale-105 transition-all duration-200",
          tool.color
        )}>
          <Icon size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors truncate">
            {tool.name}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {tool.description}
          </p>
        </div>
        <ChevronRight 
          size={14} 
          className="text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200" 
        />
      </DropdownMenuItem>
    </motion.div>
  );
}

// ============================================
// Main Component
// ============================================

export default function ToolsMenu() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  
  const analysisTools = tools.filter(t => t.category === "analysis");
  const draftingTools = tools.filter(t => t.category === "drafting");
  const complianceTools = tools.filter(t => t.category === "compliance");

  const handleToolClick = (href: string) => {
    router.push(href);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "gap-2 rounded-lg",
            "text-muted-foreground hover:text-foreground",
            "hover:bg-muted/80",
            "transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
          data-tour="tools-menu"
        >
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-accent shadow-sm">
            <Wrench size={12} className="text-white" />
          </div>
          <span className="hidden sm:inline font-medium text-sm">Legal Tools</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className={cn(
          "w-80 rounded-2xl overflow-hidden p-0",
          "bg-popover/95 backdrop-blur-xl",
          "border border-border/50",
          "shadow-xl"
        )}
      >
        {/* Header */}
        <DropdownMenuLabel className="flex items-center gap-3 px-5 py-4 border-b border-border/30 bg-muted/30">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
            <Gavel size={16} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-foreground font-semibold leading-none">Legal Tools</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-1">
              Professional Suite
            </span>
          </div>
        </DropdownMenuLabel>
        
        {/* Analysis Tools */}
        <div className="px-3 py-2">
          <DropdownMenuLabel className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1 px-2">
            Analysis
          </DropdownMenuLabel>
          <div className="space-y-0.5">
            {analysisTools.map((tool, index) => (
              <ToolItem
                key={tool.id}
                tool={tool}
                index={index}
                baseDelay={0.1}
                onSelect={handleToolClick}
                prefersReducedMotion={prefersReducedMotion}
              />
            ))}
          </div>
        </div>
        
        <DropdownMenuSeparator className="my-1 mx-3" />

        {/* Drafting Tools */}
        <div className="px-3 py-2">
          <DropdownMenuLabel className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1 px-2">
            Drafting
          </DropdownMenuLabel>
          <div className="space-y-0.5">
            {draftingTools.map((tool, index) => (
              <ToolItem
                key={tool.id}
                tool={tool}
                index={index}
                baseDelay={0.2}
                onSelect={handleToolClick}
                prefersReducedMotion={prefersReducedMotion}
              />
            ))}
          </div>
        </div>
        
        <DropdownMenuSeparator className="my-1 mx-3" />

        {/* Compliance Tools */}
        <div className="px-3 py-2">
          <DropdownMenuLabel className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1 px-2">
            Compliance
          </DropdownMenuLabel>
          <div className="space-y-0.5">
            {complianceTools.map((tool, index) => (
              <ToolItem
                key={tool.id}
                tool={tool}
                index={index}
                baseDelay={0.3}
                onSelect={handleToolClick}
                prefersReducedMotion={prefersReducedMotion}
              />
            ))}
          </div>
        </div>

        <DropdownMenuSeparator className="my-1 mx-3" />

        {/* Resource Tools */}
        <div className="px-3 py-2">
          <DropdownMenuLabel className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1 px-2">
            Resources
          </DropdownMenuLabel>
          <div className="space-y-0.5">
            {tools.filter(t => t.category === "resources").map((tool, index) => (
              <ToolItem
                key={tool.id}
                tool={tool}
                index={index}
                baseDelay={0.4}
                onSelect={handleToolClick}
                prefersReducedMotion={prefersReducedMotion}
              />
            ))}
          </div>
        </div>

        <DropdownMenuSeparator className="my-1 mx-3" />
        
        {/* View All Link */}
        <div className="px-3 py-2 pb-3">
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 5 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.4, duration: prefersReducedMotion ? 0 : 0.2 }}
          >
            <DropdownMenuItem
              onSelect={() => handleToolClick("/tools")}
              className={cn(
                "!cursor-pointer !justify-center !p-3 !rounded-xl",
                "!bg-primary/5 hover:!bg-primary/10",
                "transition-all duration-200",
                "border border-primary/10"
              )}
            >
              <span className="font-semibold text-sm text-primary">View All Tools</span>
            </DropdownMenuItem>
          </motion.div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
