"use client";

import { memo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Sparkles,
  Scale,
} from "lucide-react";
import { EnhancedToolCard } from "@/components/EnhancedToolCard";
import { ToolIconMedium } from "@/components/ui/tool-icons";
import { cn } from "@/lib/utils";

const tools = [
  {
    id: "contract-analysis",
    name: "Contract Perspective Analyzer",
    description: "Analyze contracts from different party perspectives. Get risk scores, identify favorable and risky clauses.",
    spotlightColor: "rgba(59, 130, 246, 0.15)",
    href: "/tools/contract-analysis",
  },
  {
    id: "simplify",
    name: "Document Simplifier",
    description: "Convert complex legal documents to plain language. Get jargon glossaries and key obligations explained.",
    spotlightColor: "rgba(139, 92, 246, 0.1)",
    href: "/tools/simplify",
  },
  {
    id: "drafting",
    name: "Drafting Assistant",
    description: "Generate professional legal documents with AI. Create contracts, letters of demand, and more.",
    spotlightColor: "rgba(16, 185, 129, 0.15)",
    href: "/tools/drafting",
  },
  {
    id: "audit",
    name: "Clause Auditor",
    description: "Check contracts for missing or risky clauses. Get recommendations for improving your agreements.",
    spotlightColor: "rgba(245, 158, 11, 0.15)",
    href: "/tools/audit",
  },
  {
    id: "popia",
    name: "POPIA Checker",
    description: "Check documents for POPIA compliance. Ensure your privacy policies meet South African requirements.",
    spotlightColor: "rgba(244, 63, 94, 0.15)",
    href: "/tools/popia",
  },
  {
    id: "compare",
    name: "Document Compare",
    description: "Compare two document versions side by side. Identify additions, deletions, and modifications.",
    spotlightColor: "rgba(6, 182, 212, 0.15)",
    href: "/tools/compare",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

// Memoized tool card for better performance
const ToolCard = memo(function ToolCard({ 
  tool, 
  index 
}: { 
  tool: typeof tools[0]; 
  index: number;
}) {
  return (
    <motion.div variants={itemVariants}>
      <Link href={tool.href} prefetch={true}>
        <EnhancedToolCard
          {...tool}
          index={index}
        />
      </Link>
    </motion.div>
  );
});

export default function ToolsPage() {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Enhanced Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="text-center mb-12"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
        >
          <Sparkles size={14} className="text-primary" />
          <span className="text-sm font-medium text-primary">Professional Legal Suite</span>
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-4xl md:text-5xl font-bold text-gradient mb-4"
        >
          Legal Tools Suite
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
        >
          Powerful AI-assisted tools to help with your legal research, 
          document analysis, and preparation. Professional-grade analysis 
          for South African law.
        </motion.p>
      </motion.div>

      {/* Tools Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        {tools.map((tool, index) => (
          <ToolCard key={tool.id} tool={tool} index={index} />
        ))}
      </motion.div>

      {/* Footer hint */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center text-sm text-muted-foreground mt-12"
      >
        All tools support drag-and-drop document upload • Powered by AI
      </motion.p>
    </div>
  );
}
