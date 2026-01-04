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
// Main Component
// ============================================

export default function ToolsMenu() {
  const router = useRouter();
  
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
          className="gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          data-tour="tools-menu"
        >
          <div className="p-1 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 shadow-md shadow-blue-500/10">
            <Wrench size={14} className="text-white" />
          </div>
          <span className="hidden sm:inline font-semibold tracking-tight">Legal Tools</span>
        </Button>
      </DropdownMenuTrigger>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <DropdownMenuContent align="end" className="w-80 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden p-0">
         <DropdownMenuLabel className="flex items-center gap-3 px-5 py-4 border-b border-border/30 bg-muted/20">
           <div className="p-1.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
             <Gavel size={16} className="text-white" />
           </div>
           <div className="flex flex-col">
             <span className="text-foreground font-bold leading-none">Legal Tools</span>
             <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Professional Suite</span>
           </div>
         </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Analysis Tools */}
        <motion.div
          className="px-4 py-2"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.2 }}
        >
           <DropdownMenuLabel className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
             Analysis
           </DropdownMenuLabel>
           <div className="space-y-1">
             {analysisTools.map((tool, index) => {
               const Icon = tool.icon;
               return (
                 <motion.div
                   key={tool.id}
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: 0.1 + index * 0.05, duration: 0.2 }}
                 >
                   <DropdownMenuItem
                     onSelect={() => handleToolClick(tool.href)}
                     className="!cursor-pointer !p-3 !rounded-lg hover:!bg-green-50 focus:!bg-green-50 transition-colors duration-200 group"
                   >
                     <div className={`p-2 rounded-lg bg-gradient-to-br ${tool.color} mr-3 shadow-sm`}>
                       <Icon size={16} className="text-white" />
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="font-medium text-sm text-foreground group-hover:text-slate-900 group-focus:text-slate-900 transition-colors truncate">{tool.name}</p>
                       <p className="text-xs text-muted-foreground group-hover:text-slate-600 group-focus:text-slate-600 transition-colors line-clamp-2">{tool.description}</p>
                     </div>
                     <ChevronRight size={14} className="text-muted-foreground group-hover:text-slate-700 group-focus:text-slate-700 transition-colors" />
                   </DropdownMenuItem>
                 </motion.div>
               );
             })}
           </div>
         </motion.div>
        
         <DropdownMenuSeparator className="my-1" />

         {/* Drafting Tools */}
         <motion.div
           className="px-4 py-2"
           initial={{ opacity: 0, x: -10 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.2, duration: 0.2 }}
         >
           <DropdownMenuLabel className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
             Drafting
           </DropdownMenuLabel>
           <div className="space-y-1">
             {draftingTools.map((tool, index) => {
               const Icon = tool.icon;
               return (
                 <motion.div
                   key={tool.id}
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: 0.2 + index * 0.05, duration: 0.2 }}
                 >
                   <DropdownMenuItem
                     onSelect={() => handleToolClick(tool.href)}
                     className="!cursor-pointer !p-3 !rounded-lg hover:!bg-green-50 focus:!bg-green-50 transition-colors duration-200 group"
                   >
                     <div className={`p-2 rounded-lg bg-gradient-to-br ${tool.color} mr-3 shadow-sm`}>
                       <Icon size={16} className="text-white" />
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="font-medium text-sm text-foreground group-hover:text-slate-900 group-focus:text-slate-900 transition-colors truncate">{tool.name}</p>
                       <p className="text-xs text-muted-foreground group-hover:text-slate-600 group-focus:text-slate-600 transition-colors line-clamp-2">{tool.description}</p>
                     </div>
                     <ChevronRight size={14} className="text-muted-foreground group-hover:text-slate-700 group-focus:text-slate-700 transition-colors" />
                   </DropdownMenuItem>
                   </motion.div>
                   );
                   })}
                   </div>
                   </motion.div>
                   
                   <DropdownMenuSeparator className="my-1" />

                   {/* Compliance Tools */}
                   <motion.div
                   className="px-4 py-2"
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: 0.3, duration: 0.2 }}
                   >
                   <DropdownMenuLabel className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
                   Compliance
                   </DropdownMenuLabel>
                   <div className="space-y-1">
                   {complianceTools.map((tool, index) => {
                   const Icon = tool.icon;
                   return (
                   <motion.div
                   key={tool.id}
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: 0.3 + index * 0.05, duration: 0.2 }}
                   >
                   <DropdownMenuItem
                     onSelect={() => handleToolClick(tool.href)}
                     className="!cursor-pointer !p-3 !rounded-lg hover:!bg-green-50 focus:!bg-green-50 transition-colors duration-200 group"
                   >
                     <div className={`p-2 rounded-lg bg-gradient-to-br ${tool.color} mr-3 shadow-sm`}>
                       <Icon size={16} className="text-white" />
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="font-medium text-sm text-foreground group-hover:text-slate-900 group-focus:text-slate-900 transition-colors truncate">{tool.name}</p>
                       <p className="text-xs text-muted-foreground group-hover:text-slate-600 group-focus:text-slate-600 transition-colors line-clamp-2">{tool.description}</p>
                     </div>
                     <ChevronRight size={14} className="text-muted-foreground group-hover:text-slate-700 group-focus:text-slate-700 transition-colors" />
                   </DropdownMenuItem>
                 </motion.div>
                 );
                 })}
                 </div>
                 </motion.div>

                 <DropdownMenuSeparator className="my-1" />
                 
                 {/* View All Link */}
                 <motion.div
                 className="px-4 py-2"
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.4, duration: 0.2 }}
                 >
                 <DropdownMenuItem
                 onSelect={() => handleToolClick("/tools")}
                 className="!cursor-pointer !justify-center !p-3.5 !rounded-xl hover:!bg-green-50 focus:!bg-green-50 transition-all duration-300 border border-transparent m-1"
                 >
                 <span className="font-bold text-sm tracking-tight text-gradient group-hover:text-white">View All Tools</span>
                 </DropdownMenuItem>
                 </motion.div>
        </DropdownMenuContent>
      </motion.div>
     </DropdownMenu>
   );
 }
