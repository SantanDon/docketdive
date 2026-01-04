"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import type { ToolId } from "@/lib/tool-detector";

interface ToolSuggestionProps {
  toolId: ToolId;
  toolName: string;
  description: string;
  onDismiss?: () => void;
}

export default function ToolSuggestion({
  toolId,
  toolName,
  description,
  onDismiss,
}: ToolSuggestionProps) {
  const router = useRouter();
  
  const toolPaths: Record<ToolId, string> = {
    "contract-analysis": "/tools/contract-analysis",
    "simplify": "/tools/simplify",
    "drafting": "/tools/drafting",
    "audit": "/tools/audit",
    "popia": "/tools/popia",
    "compare": "/tools/compare",
  };

  const handleOpen = () => {
    router.push(toolPaths[toolId]);
    onDismiss?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4"
    >
      <Card className="p-4 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-foreground mb-1">
              Try {toolName}
            </h4>
            <p className="text-xs text-muted-foreground mb-3">
              {description}
            </p>
            <Button
              onClick={handleOpen}
              size="sm"
              variant="outline"
              className="h-7 text-xs"
            >
              Open Tool
              <ArrowRight className="ml-1.5 h-3 w-3" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}


