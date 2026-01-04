"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  Loader2,
  AlertCircle,
  Info,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DocumentDropzone from "@/components/DocumentDropzone";
import DocumentChat from "@/components/DocumentChat";
import { cn } from "@/lib/utils";
import { Spotlight } from "@/components/ui/spotlight";
import { ToolIconLarge } from "@/components/ui/tool-icons";
import { getToolTheme } from "@/components/ui/tool-themes";

// ============================================
// Types
// ============================================

interface RequirementResult {
  id: string;
  section: string;
  name: string;
  description: string;
  importance: "critical" | "recommended";
  status: "compliant" | "non_compliant" | "partial";
  confidence: number;
  matchedKeywords?: string[];
  recommendation?: string;
}

interface ComplianceReport {
  documentId: string;
  documentType: string;
  typeConfidence: number;
  requirements: RequirementResult[];
  complianceScore: number;
  summary: {
    critical: { compliant: number; nonCompliant: number };
    recommended: { compliant: number; nonCompliant: number };
  };
  gaps: string[];
  recommendations: string[];
  generatedAt: string;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

// ============================================
// Score Circle Component
// ============================================

function ComplianceScoreCircle({ score }: { score: number }) {
  const getConfig = () => {
    if (score >= 80) return { 
      text: "text-green-600 dark:text-green-400", 
      bg: "bg-green-100/50 dark:bg-green-900/30",
      border: "border-green-200/50 dark:border-green-800/50",
      label: "High Compliance" 
    };
    if (score >= 50) return { 
      text: "text-rose-600 dark:text-rose-400", 
      bg: "bg-rose-100/50 dark:bg-rose-900/30",
      border: "border-rose-200/50 dark:border-rose-800/50",
      label: "Moderate Gaps" 
    };
    return { 
      text: "text-destructive", 
      bg: "bg-destructive/10",
      border: "border-destructive/20",
      label: "Critical Gaps" 
    };
  };
  const config = getConfig();
  
  return (
    <motion.div 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className={cn(
        "w-32 h-32 rounded-4xl flex flex-col items-center justify-center border-2", 
        config.bg, 
        config.border,
        "shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none"
      )}
    >
      <span className={cn("text-4xl font-bold tracking-tight", config.text)}>{score}%</span>
      <span className={cn("text-[10px] uppercase tracking-widest font-bold mt-1", config.text)}>{config.label}</span>
      <div className="mt-2 text-[8px] text-muted-foreground/60 font-medium">COMPLIANCE SCORE</div>
    </motion.div>
  );
}

// ============================================
// Requirement Card Component
// ============================================

function RequirementCard({ requirement }: { requirement: RequirementResult }) {
  const [expanded, setExpanded] = useState(false);

  const statusConfig = {
    compliant: { icon: CheckCircle, color: "text-green-600 dark:text-green-400", bg: "bg-green-500/5", border: "border-green-200/50 dark:border-green-800/20", label: "Compliant" },
    non_compliant: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/5", border: "border-destructive/20", label: "Missing" },
    partial: { icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/5", border: "border-amber-200/50 dark:border-amber-800/20", label: "Partial" },
  };

  const importanceConfig = {
    critical: { label: "Critical", color: "bg-destructive/10 text-destructive border-destructive/20" },
    recommended: { label: "Recommended", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" },
  };

  const { icon: StatusIcon, color, bg, border, label: statusLabel } = statusConfig[requirement.status];
  const importance = importanceConfig[requirement.importance];

  return (
    <Spotlight as={motion.div} variants={itemVariants} layout className={cn("rounded-3xl border-0 overflow-hidden transition-all duration-300", bg, expanded && "shadow-lg")}>
      <div
        className="p-6 cursor-pointer flex items-center justify-between hover:bg-muted/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4 flex-1">
          <div className={cn("p-3 rounded-2xl", bg, border)}>
            <StatusIcon size={24} className={color} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-lg tracking-tight text-foreground">{requirement.name}</p>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">{requirement.section}</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border", importance.color)}>
                {importance.label}
              </span>
              <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full", bg, color, "border border-current/10")}>
                {statusLabel}
              </span>
            </div>
          </div>
        </div>
        <motion.div 
          className="p-2 text-muted-foreground/40"
          animate={{ rotate: expanded ? 180 : 0 }}
        >
          <ChevronDown size={20} />
        </motion.div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-6 pb-6 pt-0 space-y-4"
          >
            <div className="pt-4 border-t border-border/40">
              <p className="text-sm leading-relaxed text-muted-foreground font-medium">
                {requirement.description}
              </p>
            </div>
            
            {requirement.matchedKeywords && requirement.matchedKeywords.length > 0 && (
              <div className="p-4 rounded-2xl bg-muted/20 border border-border/40">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">Evidence Found</p>
                <div className="flex flex-wrap gap-1.5">
                  {requirement.matchedKeywords.map((kw, idx: number) => (
                    <span key={idx} className="text-xs font-medium bg-green-500/10 text-green-700 dark:text-green-400 px-3 py-1 rounded-lg border border-green-500/10">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {requirement.recommendation && (
              <div className="p-4 bg-rose-500/5 rounded-2xl border border-rose-500/20">
                <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-1.5">
                  <Sparkles size={12} />
                  Suggested Remediation
                </p>
                <p className="text-sm text-foreground leading-relaxed font-medium">
                  {requirement.recommendation}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Spotlight>
  );
}

// ============================================
// Main Component
// ============================================

interface POPIACheckerProps {
  documentContent?: string;
  onClose?: () => void;
}

export default function POPIAChecker({ documentContent, onClose }: POPIACheckerProps) {
  const theme = getToolTheme('popia');
  const [content, setContent] = useState(documentContent || "");
  const [documentType, setDocumentType] = useState<string>("");
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);

  const handleDocumentLoaded = (text: string, metadata: { fileName: string }) => {
    setContent(text);
    setUploadedFileName(metadata.fileName);
    setError(null);
  };

  const checkCompliance = async () => {
    if (!content.trim()) return;

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const res = await fetch("/api/popia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content,
          documentType: documentType || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Compliance check failed");
      }

      const data = await res.json();
      setReport(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const documentTypeNames: Record<string, string> = {
    privacy_policy: "Privacy Policy",
    data_processing_agreement: "Data Processing Agreement (Operator Agreement)",
    consent_form: "Consent Form",
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="w-full flex flex-col gap-10"
    >
      {/* Minimal Header */}
      <div className="relative pt-6 pb-2 px-1">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <ToolIconLarge toolId="popia" />
          <div className="text-center sm:text-left space-y-2">
             <div className="flex items-center justify-center sm:justify-start gap-2">
               <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border border-border px-2 py-0.5 rounded-md">
                 Compliance Tool
               </span>
             </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              POPIA<span className="font-light opacity-70">Checker</span>
            </h1>
            <p className="text-muted-foreground text-lg font-medium max-w-xl leading-relaxed">
              Automated South African data privacy audit for policies and agreements.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full">
        {!report ? (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-10">
            {/* Input Island */}
            <div className="p-8 rounded-3xl bg-white/50 dark:bg-slate-900/50 shadow-sm space-y-8">
              <div className="flex items-center gap-3 px-1">
                <div className="h-1 w-8 bg-rose-500 rounded-full" />
                <h3 className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Audit Configuration</h3>
              </div>

              {/* Disclaimer */}
              <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-4">
                <AlertTriangle size={20} className="text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="extra-small-bold text-amber-600 uppercase tracking-widest">Legal Disclaimer</p>
                  <p className="text-xs text-amber-800/70 dark:text-amber-300/60 mt-0.5 font-medium leading-relaxed">
                    This tool uses pattern matching for screening. It is not a substitute for professional legal advice.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Document Type Selector */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                    Document Type
                  </label>
                  <div className="relative">
                    <select
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                      className="w-full h-12 pl-4 pr-10 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold appearance-none focus:ring-2 focus:ring-rose-500 transition-all cursor-pointer"
                    >
                      <option value="">Auto-detect Type</option>
                      <option value="privacy_policy">Privacy Policy</option>
                      <option value="data_processing_agreement">DPA (Operator Agreement)</option>
                      <option value="consent_form">Consent Form</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </div>

                {/* Upload Section */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                    Secure Upload
                  </label>
                  <DocumentDropzone
                    onDocumentLoaded={handleDocumentLoaded}
                    onError={(err) => setError(err)}
                    disabled={loading}
                    variant="compact"
                    toolTheme={theme}
                  />
                </div>
              </div>

              {/* Separator */}
              <div className="relative text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <span className="relative px-4 bg-background text-xs font-medium text-muted-foreground">or paste text</span>
              </div>

              {/* Text Area */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    {uploadedFileName ? (
                      <span className="text-green-600 dark:text-green-400 flex items-center gap-2">
                        <CheckCircle size={14} /> File Loaded: {uploadedFileName}
                      </span>
                    ) : (
                      "Document Content"
                    )}
                  </label>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    setUploadedFileName(null);
                  }}
                  placeholder="Paste policy or agreement text here..."
                  className="w-full h-80 p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm font-mono focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none resize-none shadow-inner transition-all leading-relaxed"
                  disabled={loading}
                />
                <div className="flex justify-between items-center px-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {content.length.toLocaleString()} Characters
                  </p>
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  className="p-5 bg-destructive/10 text-destructive rounded-2xl flex items-center gap-4 border border-destructive/20"
                >
                  <AlertCircle size={24} />
                  <p className="font-bold tracking-tight">{error}</p>
                </motion.div>
              )}

              <Button
                onClick={checkCompliance}
                disabled={!content.trim() || loading}
                className="w-full h-14 rounded-2xl font-bold text-base transition-all shadow-sm"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Analyzing POPIA Compliance...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2" size={20} />
                    Audit Document
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-10">
            {/* Results Header Island */}
            <div className="p-8 rounded-3xl bg-white/50 dark:bg-slate-900/50 shadow-sm flex items-center justify-between flex-wrap gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
                    <CheckCircle size={20} className="text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Audit Summary</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Compliance verification successfully completed</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 min-w-[200px] shadow-inner">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Detected Format</p>
                    <p className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                      {documentTypeNames[report.documentType] || report.documentType}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-rose-500 to-pink-500" 
                          initial={{ width: 0 }} 
                          animate={{ width: `${report.typeConfidence * 100}%` }} 
                        />
                      </div>
                      <span className="text-[9px] font-black text-rose-600 dark:text-rose-400 whitespace-nowrap tracking-tighter">
                        {Math.round(report.typeConfidence * 100)}% MATCH
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <ComplianceScoreCircle score={report.complianceScore} />
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div variants={itemVariants} className="p-8 rounded-4xl bg-destructive/5 border border-destructive/20 space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-destructive mb-2">Critical Requirements</p>
                <div className="flex items-end justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-destructive">{report.summary.critical.nonCompliant}</span>
                    <span className="text-lg font-bold text-destructive/60">Gaps</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-green-600">{report.summary.critical.compliant}</span>
                    <p className="text-[10px] font-bold text-green-600/60 uppercase tracking-widest leading-none mt-1">Requirements Met</p>
                  </div>
                </div>
                <div className="h-2 w-full bg-destructive/10 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-destructive" 
                    initial={{ width: 0 }} 
                    animate={{ width: `${(report.summary.critical.nonCompliant / (report.summary.critical.compliant + report.summary.critical.nonCompliant)) * 100}%` }} 
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="p-8 rounded-4xl bg-rose-500/5 border border-rose-500/20 space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-2">Recommended Standards</p>
                <div className="flex items-end justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-rose-600 dark:text-rose-400">{report.summary.recommended.nonCompliant}</span>
                    <span className="text-lg font-bold text-rose-500/60">Gaps</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-green-600">{report.summary.recommended.compliant}</span>
                    <p className="text-[10px] font-bold text-green-600/60 uppercase tracking-widest leading-none mt-1">Safeguards Met</p>
                  </div>
                </div>
                <div className="h-2 w-full bg-rose-500/10 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]" 
                    initial={{ width: 0 }} 
                    animate={{ width: `${(report.summary.recommended.nonCompliant / (report.summary.recommended.compliant + report.summary.recommended.nonCompliant)) * 100}%` }} 
                  />
                </div>
              </motion.div>
            </div>

            {/* Critical Gaps Island */}
            {report.gaps.length > 0 && (
              <motion.div variants={itemVariants} className="p-8 rounded-4xl bg-destructive/3 border border-destructive/20 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-destructive/10">
                    <AlertTriangle size={24} className="text-destructive" />
                  </div>
                  <h3 className="text-xl font-bold text-destructive tracking-tight">Compliance Gaps Identified</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {report.gaps.map((gap, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-white/50 dark:bg-card/30 border border-destructive/10 flex items-start gap-3">
                      <span className="h-5 w-5 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 text-destructive text-[10px] font-bold">!</span>
                      <span className="text-sm font-semibold text-destructive/80 leading-snug">{gap}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Recommendations Island */}
            {report.recommendations.length > 0 && (
              <motion.div variants={itemVariants} className="p-8 rounded-4xl bg-rose-500/3 border border-rose-500/20 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    <Sparkles size={24} />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight">Priority Remediation</h3>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  {report.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground font-medium flex items-center gap-3 leading-snug">
                       <span className="h-1.5 w-1.5 rounded-full bg-rose-500/60 shrink-0" />
                       {rec}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Requirements List Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <p className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                  Detailed POPIA Audit Points
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 bg-muted/40 px-2 py-0.5 rounded-full">
                    {report.requirements.length} ITEMS
                  </span>
                </p>
                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-destructive" /> MISSING
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-amber-500" /> PARTIAL
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-green-500" /> MET
                  </div>
                </div>
              </div>
              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 gap-4">
                {report.requirements
                  .sort((a, b) => {
                    const importanceOrder = { critical: 0, recommended: 1 };
                    const statusOrder = { non_compliant: 0, partial: 1, compliant: 2 };
                    const impDiff = importanceOrder[a.importance] - importanceOrder[b.importance];
                    if (impDiff !== 0) return impDiff;
                    return statusOrder[a.status] - statusOrder[b.status];
                  })
                  .map((req) => (
                    <RequirementCard key={req.id} requirement={req} />
                  ))}
              </motion.div>
            </div>

            {/* Information Regulator Island */}
            <motion.div variants={itemVariants} className="p-8 rounded-4xl bg-muted/5 flex flex-col sm:flex-row items-center justify-between gap-8">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Info size={24} className="text-primary" />
                </div>
                <div>
                  <h4 className="font-bold tracking-tight">Information Regulator Contact</h4>
                  <p className="text-sm text-muted-foreground font-medium">Official channel for compliance queries and complaints.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full sm:w-auto">
                {[
                  { label: "Email", value: "complaints@inforegulator.org.za" },
                  { label: "Phone", value: "+27 10 023 5200" },
                  { label: "Website", value: "inforegulator.org.za" }
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-2xl bg-card border border-border/40 text-center sm:text-left">
                    <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-0.5">{item.label}</p>
                    <p className="text-[10px] font-bold truncate text-rose-600 dark:text-rose-400">{item.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Action Island */}
            <div className="p-8 rounded-4xl bg-muted/10 shadow-sm space-y-4">
              <Button
                variant="outline"
                onClick={() => setShowChat(!showChat)}
                className={cn(
                  "w-full h-16 rounded-2xl border-rose-500/20 hover:bg-rose-500/5 font-bold text-lg transition-all",
                  showChat && "bg-rose-500/10 border-rose-500/50"
                )}
              >
                <MessageSquare className="mr-3" size={24} />
                {showChat ? "Close Compliance Advisor" : "Consult POPIA Advisor Chat"}
              </Button>
              
              <AnimatePresence>
                {showChat && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4">
                      <DocumentChat
                        documentContent={content}
                        documentName={uploadedFileName || undefined}
                        onClose={() => setShowChat(false)}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                variant="outline"
                onClick={() => {
                  setReport(null);
                  setContent("");
                  setDocumentType("");
                  setUploadedFileName(null);
                  setShowChat(false);
                }}
                className="w-full h-14 rounded-2xl border-border/60 hover:bg-muted/50 font-semibold"
              >
                Audit New Document
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      {onClose && (
        <div className="border-t border-border p-4">
          <Button variant="outline" onClick={onClose} className="w-full h-11 rounded-xl">
            Close
          </Button>
        </div>
      )}
    </motion.div>
  );
}
