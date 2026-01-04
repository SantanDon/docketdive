"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileSearch,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  Loader2,
  Shield,
  AlertCircle,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import DocumentDropzone from "@/components/DocumentDropzone";
import DocumentChat from "@/components/DocumentChat";
import { Spotlight } from "@/components/ui/spotlight";
import { getToolTheme, getThemeClasses } from "@/components/ui/tool-themes";

// Types
interface ClauseResult {
  id: string;
  name: string;
  category?: string;
  importance: "critical" | "recommended" | "optional";
  status: "present" | "missing" | "partial";
  confidence: number;
  location?: string;
  suggestion?: string;
  unusualLanguage?: string[];
  isStandard?: boolean;
}

interface AuditReport {
  documentId: string;
  contractType: string;
  typeConfidence: number;
  clauses: ClauseResult[];
  riskyClauseCount: number;
  overallScore: number;
  summary: {
    critical: { present: number; missing: number };
    recommended: { present: number; missing: number };
    optional: { present: number; missing: number };
  };
  recommendations: string[];
  unusualClausesCount?: number;
  generatedAt: string;
}

// Score Circle Component
function ScoreCircle({ score }: { score: number }) {
  const getConfig = () => {
    if (score >= 80) return { text: "text-green-600 dark:text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", glow: "shadow-green-500/20" };
    if (score >= 60) return { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", glow: "shadow-amber-500/20" };
    return { text: "text-red-600 dark:text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", glow: "shadow-red-500/20" };
  };
  const config = getConfig();

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "w-32 h-32 rounded-4xl flex flex-col items-center justify-center border-2 shadow-2xl backdrop-blur-sm",
        config.bg, config.border, config.glow
      )}
    >
      <span className={cn("text-4xl font-bold tracking-tight", config.text)}>{score}</span>
      <span className={cn("text-xs font-semibold uppercase tracking-widest mt-1 opacity-70", config.text)}>Score</span>
    </motion.div>
  );
}

// Clause Card Component
function ClauseCard({ clause }: { clause: ClauseResult }) {
  const [expanded, setExpanded] = useState(false);

  const statusConfig = {
    present: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-50 dark:bg-green-500/5", border: "border-green-200 dark:border-green-500/20", label: "Present" },
    missing: { icon: XCircle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/5", border: "border-red-200 dark:border-red-500/20", label: "Missing" },
    partial: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/5", border: "border-amber-200 dark:border-amber-500/20", label: "Partial" },
  };

  const importanceConfig = {
    critical: { label: "Critical", color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" },
    recommended: { label: "Recommended", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
    optional: { label: "Optional", color: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20" },
  };

  const { icon: StatusIcon, color, bg, border, label: statusLabel } = statusConfig[clause.status];
  const importance = importanceConfig[clause.importance];
  const hasUnusualLanguage = clause.unusualLanguage && clause.unusualLanguage.length > 0;

  return (
    <Spotlight
      as={motion.div}
      layout
      className={cn(
        "rounded-3xl transition-all duration-300 overflow-hidden group border-0",
        expanded ? "shadow-xl" : "hover:shadow-lg",
        bg
      )}
      spotlightColor="rgba(255, 255, 255, 0.2)"
    >
      <div 
        className="p-5 cursor-pointer flex items-center justify-between" 
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-5">
          <div className={cn("p-2.5 rounded-2xl bg-white dark:bg-slate-900 shadow-sm", color)}>
            <StatusIcon size={24} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <p className="font-bold text-lg text-foreground tracking-tight">{clause.name}</p>
              {hasUnusualLanguage && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider">
                  <AlertTriangle size={10} />
                  <span>Alert</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={cn("text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border", importance.color)}>
                {importance.label}
              </span>
              {clause.category && (
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold uppercase tracking-wider border border-primary/20">
                  {clause.category.replace(/_/g, ' ')}
                </span>
              )}
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                {clause.confidence}% Confidence
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <span className={cn("text-xs font-bold uppercase tracking-widest hidden sm:block opacity-60", color)}>
            {statusLabel}
          </span>
          <motion.div 
            className="p-2 rounded-full bg-slate-200/50 dark:bg-slate-800/50 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300" 
            animate={{ rotate: expanded ? 180 : 0 }}
          >
            <ChevronDown size={18} />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: "auto", opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }} 
            className="border-t border-border/40 p-6 bg-white/40 dark:bg-black/20 backdrop-blur-sm"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {clause.location && (
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <FileSearch size={12} />
                      Source Location
                    </p>
                    <p className="text-sm text-foreground/80 leading-relaxed font-medium">{clause.location}</p>
                  </div>
                )}
                
                {clause.suggestion && (
                  <div>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <Sparkles size={12} />
                      Suggested Language
                    </p>
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 border-dashed">
                      <p className="text-sm text-foreground/80 italic leading-relaxed">{clause.suggestion}</p>
                    </div>
                  </div>
                )}
              </div>

              {hasUnusualLanguage && (
                <div>
                  <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <AlertTriangle size={12} />
                    Unusual Findings
                  </p>
                  <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                    <ul className="space-y-2">
                      {clause.unusualLanguage!.map((lang, idx) => (
                        <li key={idx} className="text-sm text-foreground/70 flex items-start gap-2.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                          <span>{lang}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Spotlight>
  );
}

// Main Component
interface ClauseAuditorProps {
  documentContent?: string;
  onClose?: () => void;
}

export default function ClauseAuditor({ documentContent, onClose }: ClauseAuditorProps) {
  const theme = getToolTheme('auditor');
  const [content, setContent] = useState(documentContent || "");
  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);

  const handleDocumentLoaded = (text: string, metadata: { fileName: string }) => {
    setContent(text);
    setUploadedFileName(metadata.fileName);
    setError(null);
  };

  const auditContract = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Audit failed");
      }
      const data = await res.json();
      setReport(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const contractTypeNames: Record<string, string> = {
    employment: "Employment Contract",
    lease_residential: "Residential Lease",
    service_agreement: "Service Agreement",
    nda: "Non-Disclosure Agreement",
    sale_agreement: "Sale Agreement",
    loan_agreement: "Loan Agreement",
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="w-full flex flex-col"
    >
      {/* Minimal Header */}
      <div className="w-full mb-8 pt-6 px-1">
        <div className="flex items-center justify-between gap-8">
          <div className="flex items-start gap-5">
            <div className="h-14 w-14 rounded-2xl bg-muted/20 flex items-center justify-center border border-border/50">
              <FileSearch size={28} className="text-foreground" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Clause Auditor</h1>
              <p className="text-muted-foreground text-sm font-medium">Audit contracts for missing or risky legal provisions</p>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-10 w-10 hover:bg-muted">
              <XCircle size={20} className="text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Configuration/Summary Island */}
        <div className="lg:col-span-12">
          {!report ? (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-full"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-12 space-y-6">
                  <div className="flex items-center gap-3 px-1">
                    <div className={cn("h-1 w-8 rounded-full", theme.secondary.replace('from-', 'bg-').split(' ')[0])} />
                    <h3 className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Contract Analysis</h3>
                  </div>

                  <div className={cn("p-8 rounded-3xl shadow-sm space-y-8", theme.cardBg)}>
                    <DocumentDropzone
                      onDocumentLoaded={handleDocumentLoaded}
                      onError={(err) => setError(err)}
                      disabled={loading}
                      variant="compact"
                      toolTheme={theme}
                    />

                    <div className="relative text-center">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                      </div>
                      <span className="relative px-4 bg-transparent text-[10px] uppercase font-bold tracking-widest text-slate-400">
                        or input manually
                      </span>
                    </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Contract Content
                      </label>
                      {uploadedFileName && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider border border-green-500/20">
                          <CheckCircle size={10} />
                          <span>{uploadedFileName}</span>
                        </div>
                      )}
                    </div>
                    <textarea
                      value={content}
                      onChange={(e) => {
                        setContent(e.target.value);
                        setUploadedFileName(null);
                      }}
                      placeholder="Paste the full contract text here..."
                      className="w-full h-80 px-6 py-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none shadow-inner transition-all leading-relaxed"
                      disabled={loading}
                    />
                    <div className="flex justify-between items-center px-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {content.length.toLocaleString()} Characters
                      </p>
                    </div>
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center gap-3 font-medium shadow-lg shadow-red-500/5"
                  >
                    <AlertCircle size={20} className="shrink-0" />
                    <p className="text-sm">{error}</p>
                  </motion.div>
                )}

                <Button
                  onClick={auditContract}
                  disabled={!content.trim() || loading}
                  className="w-full h-16 rounded-2xl font-bold tracking-wide text-sm shadow-sm"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin mr-3" size={20} />
                      Analyzing Compliance...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-3" size={20} />
                      Audit Entire Contract
                    </>
                  )}
                </Button>
              </div>
            </div>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-10">
              {/* Results Island */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 md:p-12 rounded-4xl bg-muted/10 backdrop-blur-sm shadow-xl"
              >
                <div className="max-w-5xl mx-auto space-y-12">
                  {/* Summary Section */}
                  <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="flex-1 space-y-4 text-center md:text-left">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20">
                        Audited Results
                      </div>
                      <h2 className="text-3xl font-extrabold tracking-tight">Contract Overview</h2>
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                        <div className="px-4 py-2 rounded-2xl bg-background/50 border border-border/50 shadow-sm">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Classification</p>
                          <p className="font-bold text-foreground leading-none">{contractTypeNames[report.contractType] || report.contractType}</p>
                        </div>
                        <div className="px-4 py-2 rounded-2xl bg-background/50 border border-border/50 shadow-sm">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Confidence</p>
                          <p className="font-bold text-foreground leading-none">{Math.round(report.typeConfidence * 100)}%</p>
                        </div>
                      </div>
                    </div>
                    <ScoreCircle score={report.overallScore} />
                  </div>

                  {/* Summary Tiles */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="p-6 rounded-3xl bg-red-500/5 border border-red-500/20 shadow-lg shadow-red-500/5 text-center transition-all hover:scale-[1.02]">
                      <p className="text-4xl font-black text-red-600 dark:text-red-400 mb-1 leading-none">{report.summary.critical.missing}</p>
                      <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">Critical Missing</p>
                    </div>
                    <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/20 shadow-lg shadow-amber-500/5 text-center transition-all hover:scale-[1.02]">
                      <p className="text-4xl font-black text-amber-600 dark:text-amber-400 mb-1 leading-none">{report.summary.recommended.missing}</p>
                      <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">Rec. Missing</p>
                    </div>
                    <div className="p-6 rounded-3xl bg-green-500/5 border border-green-500/20 shadow-lg shadow-green-500/5 text-center transition-all hover:scale-[1.02]">
                      <p className="text-4xl font-black text-green-600 dark:text-green-400 mb-1 leading-none">
                        {report.summary.critical.present + report.summary.recommended.present}
                      </p>
                      <p className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-widest">Clauses Found</p>
                    </div>
                    <div className="p-6 rounded-3xl bg-purple-500/5 border border-purple-500/20 shadow-lg shadow-purple-500/5 text-center transition-all hover:scale-[1.02]">
                      <p className="text-4xl font-black text-purple-600 dark:text-purple-400 mb-1 leading-none">{report.unusualClausesCount || 0}</p>
                      <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">Unusual Usage</p>
                    </div>
                  </div>

                  {/* Recommendation Island */}
                  {report.recommendations.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-8 rounded-4xl bg-primary/5 shadow-lg"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className="h-8 w-8 rounded-xl bg-primary/20 flex items-center justify-center">
                          <Sparkles size={18} className="text-primary" />
                        </div>
                        <h3 className="text-lg font-bold tracking-tight">Audit Recommendations</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {report.recommendations.map((rec, idx) => (
                          <div key={idx} className="p-4 rounded-2xl bg-background/40 border border-border/40 text-sm text-foreground/80 leading-relaxed font-medium flex items-start gap-3">
                            <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                            {rec}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Clause List Section */}
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
                      <div className="space-y-1">
                        <h3 className="text-xl font-extrabold tracking-tight">Detailed Clause Analysis</h3>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                          Evaluating {report.clauses.length} core clauses
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                         {/* Optional filter/sort controls could go here */}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {report.clauses
                        .sort((a, b) => {
                          const importanceOrder = { critical: 0, recommended: 1, optional: 2 };
                          const statusOrder = { missing: 0, partial: 1, present: 2 };
                          const impDiff = importanceOrder[a.importance] - importanceOrder[b.importance];
                          if (impDiff !== 0) return impDiff;
                          return statusOrder[a.status] - statusOrder[b.status];
                        })
                        .map((clause) => <ClauseCard key={clause.id} clause={clause} />)}
                    </div>
                  </div>

                  {/* Detailed Actions Island */}
                  <div className="p-8 rounded-4xl bg-muted/5 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowChat(!showChat)}
                        className="flex-1 h-14 rounded-2xl border-border/60 hover:bg-slate-500/5 font-bold uppercase tracking-widest text-xs transition-all"
                      >
                        <MessageSquare className="mr-2" size={18} />
                        {showChat ? "Hide Document Chat" : "Deep-Dive Contract Chat"}
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => { setReport(null); setContent(""); setUploadedFileName(null); setShowChat(false); }}
                        className="flex-1 h-14 rounded-2xl border-border/60 hover:bg-slate-500/5 font-bold uppercase tracking-widest text-xs transition-all"
                      >
                        Audit Another Attachment
                      </Button>
                    </div>

                    <AnimatePresence>
                      {showChat && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="pt-6"
                        >
                          <DocumentChat
                            documentContent={content}
                            documentName={uploadedFileName || undefined}
                            onClose={() => setShowChat(false)}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}