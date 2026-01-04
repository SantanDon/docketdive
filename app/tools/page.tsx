"use client";

import { memo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { SpotlightCard } from "@/components/ui/spotlight-card";
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
    transition: { staggerChildren: 0.08 }
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
        <SpotlightCard 
          className="h-full cursor-pointer group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 border-border/40"
          spotlightColor={tool.spotlightColor}
        >
          <div className="p-8 h-full flex flex-col">
            <div className="flex items-start gap-5">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="transition-transform duration-500 group-hover:scale-110"
              >
                <ToolIconMedium toolId={tool.id} />
              </motion.div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300 leading-tight">
                  {tool.name}
                </h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                  {tool.description}
                </p>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-border/30 flex items-center justify-between group/footer">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 group-hover:text-primary/70 transition-colors duration-300">Explore Tool</span>
              <motion.div
                whileHover={{ x: 5 }}
                className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
              >
                <ChevronRight size={18} className="transition-transform duration-300" />
              </motion.div>
            </div>
          </div>
        </SpotlightCard>
      </Link>
    </motion.div>
  );
});

export default function ToolsPage() {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
        >
          <Sparkles size={14} className="text-primary" />
          <span className="text-sm font-medium text-primary">Professional Legal Tools</span>
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
          Legal Tools Suite
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Powerful AI-assisted tools to help with your legal research, document analysis, and preparation
        </p>
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
        transition={{ delay: 0.5 }}
        className="text-center text-sm text-muted-foreground mt-12"
      >
        All tools support drag-and-drop document upload
      </motion.p>
    </div>
  );
}
