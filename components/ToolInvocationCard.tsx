"use client";

import { motion } from "framer-motion";
import { 
  Scale, 
  Sparkles, 
  FileText, 
  FileSearch, 
  Shield, 
  GitCompare,
  ArrowRight,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ToolId } from "@/lib/tool-detector";
import { useRouter } from "next/navigation";

const toolIcons = {
  "contract-analysis": Scale,
  "simplify": Sparkles,
  "drafting": FileText,
  "audit": FileSearch,
  "popia": Shield,
  "compare": GitCompare,
};

const toolColors = {
  "contract-analysis": "from-blue-600 to-indigo-600",
  "simplify": "from-purple-600 to-indigo-600",
  "drafting": "from-violet-500 to-purple-500",
  "audit": "from-emerald-500 to-teal-500",
  "popia": "from-purple-500 to-indigo-500",
  "compare": "from-cyan-500 to-blue-500",
};

interface ToolInvocationCardProps {
  toolId: ToolId;
  onOpen: () => void;
  onDismiss: () => void;
  message?: string;
}

export default function ToolInvocationCard({
  toolId,
  onOpen,
  onDismiss,
  message,
}: ToolInvocationCardProps) {
  const router = useRouter();
  const Icon = toolIcons[toolId];
  const color = toolColors[toolId];
  
  const toolNames: Record<ToolId, string> = {
    "contract-analysis": "Contract Analyzer",
    "simplify": "Document Simplifier",
    "drafting": "Drafting Assistant",
    "audit": "Clause Auditor",
    "popia": "POPIA Checker",
    "compare": "Document Compare",
  };

  const handleOpen = () => {
    const toolPaths: Record<ToolId, string> = {
      "contract-analysis": "/tools/contract-analysis",
      "simplify": "/tools/simplify",
      "drafting": "/tools/drafting",
      "audit": "/tools/audit",
      "popia": "/tools/popia",
      "compare": "/tools/compare",
    };
    
    router.push(toolPaths[toolId]);
    onOpen();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-[70%]"
    >
      <Card className="p-4 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="flex items-start gap-3">
          <div className={cn(
            "h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 shadow-sm",
            color
          )}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-sm text-foreground">
                {toolNames[toolId]}
              </h4>
              <button
                onClick={onDismiss}
                className="p-1 rounded-md hover:bg-muted transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              I detected you want to use {toolNames[toolId]}. Would you like to open it?
            </p>
            <Button
              onClick={handleOpen}
              size="sm"
              className="w-full h-8 text-xs font-medium"
            >
              Open Tool
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}


