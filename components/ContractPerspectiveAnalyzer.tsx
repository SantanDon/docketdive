"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, Users, User, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp, Loader2, FileText, Lightbulb, AlertCircle, Clock, Sparkles, ShieldCheck, Edit3, FileSearch, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import DocumentDropzone from "@/components/DocumentDropzone";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ContractAnalysis, AnalysisPerspective, ClauseAnalysis, ModificationSuggestion } from "@/types/legal-tools";
import { Spotlight } from "@/components/ui/spotlight";
import { ToolIconLarge } from "@/components/ui/tool-icons";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

function RiskScoreCircle({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 70) return "text-green-500 bg-green-500/10 border-green-500/20";
    if (score >= 40) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-red-500 bg-red-500/10 border-red-500/20";
  };

  const label = score >= 70 ? "Low Risk" : score >= 40 ? "Moderate Risk" : "High Risk";
  const ringColor = score >= 70 ? "stroke-green-500" : score >= 40 ? "stroke-amber-500" : "stroke-red-500";

  return (
    <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-muted/20 border border-border/40">
      <div className="relative h-32 w-32 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="58"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/20"
          />
          <motion.circle
            cx="64"
            cy="64"
            r="58"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={364}
            initial={{ strokeDashoffset: 364 }}
            animate={{ strokeDashoffset: 364 - (364 * score) / 100 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className={ringColor}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold tracking-tighter text-foreground">{score}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Score</span>
        </div>
      </div>
      <div className={cn("px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.15em] border", getColor())}>
        {label}
      </div>
    </div>
  );
}

function PerspectiveSelector({
  value,
  onChange,
  disabled,
}: {
  value: AnalysisPerspective;
  onChange: (p: AnalysisPerspective) => void;
  disabled: boolean;
}) {
  const perspectives = [
    { id: "party_a" as const, label: "Party A", icon: User, desc: "Provider/Seller perspective" },
    { id: "party_b" as const, label: "Party B", icon: User, desc: "Client/Buyer perspective" },
    { id: "neutral" as const, label: "Neutral", icon: Scale, desc: "Balanced legal analysis" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {perspectives.map((p) => {
        const Icon = p.icon;
        const isSelected = value === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            disabled={disabled}
            className={cn(
              "flex flex-col items-center gap-4 p-6 rounded-3xl border transition-all duration-300 relative group",
              isSelected
                ? "border-primary bg-primary/5 shadow-2xl shadow-primary/10"
                : "border-border/40 bg-muted/10 hover:border-primary/30 hover:bg-muted/20"
            )}
          >
            <div className={cn(
              "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110",
              isSelected ? "bg-primary text-white shadow-xl shadow-primary/20" : "bg-muted/40 text-muted-foreground"
            )}>
              <Icon size={24} />
            </div>
            <div className="text-center">
              <p className={cn("font-bold text-sm tracking-tight", isSelected ? "text-foreground" : "text-muted-foreground")}>
                {p.label}
              </p>
              <p className="text-xs text-muted-foreground opacity-60 mt-1">{p.desc}</p>
            </div>
            {isSelected && (
              <motion.div 
                layoutId="active-perspective-glow"
                className="absolute inset-0 rounded-3xl ring-2 ring-primary/20 pointer-events-none"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

function ClauseCard({ clause, type }: { clause: ClauseAnalysis; type: "favorable" | "risky" }) {
  const [expanded, setExpanded] = useState(false);
  const isFavorable = type === "favorable";
  
  return (
    <Spotlight
      as={motion.div}
      layout
      variants={itemVariants}
      className={cn(
        "rounded-2xl border-0 transition-all duration-300 overflow-hidden",
        isFavorable 
          ? "bg-green-500/5 hover:border-green-500/40" 
          : "bg-red-500/5 hover:border-red-500/40"
      )}
      spotlightColor="rgba(255, 255, 255, 0.2)"
    >
      <div 
        className="p-5 cursor-pointer flex items-center gap-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
          isFavorable ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
        )}>
          {isFavorable ? <ShieldCheck size={20} /> : <AlertTriangle size={20} />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Clause {clause.clauseNumber}</span>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest",
              isFavorable ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
            )}>
              {clause.category.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-sm font-bold text-foreground leading-snug">{clause.explanation}</p>
        </div>
        <div className="p-2 text-muted-foreground/40">
          <ChevronDown size={18} className={cn("transition-transform duration-300", expanded && "rotate-180")} />
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border/40"
          >
            <div className="p-5 space-y-4 bg-muted/20">
              <div className="space-y-1.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Original Text</p>
                <p className="text-xs text-muted-foreground/80 leading-relaxed italic border-l-2 border-border/40 pl-4 py-1">"{clause.clauseText}"</p>
              </div>
              {clause.suggestedModification && (
                <div className="space-y-1.5 p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">Strategic Amendment</p>
                  <p className="text-xs font-bold text-foreground leading-relaxed">{clause.suggestedModification}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Spotlight>
  );
}

function SuggestionCard({ suggestion }: { suggestion: ModificationSuggestion }) {
  const [expanded, setExpanded] = useState(false);
  const priorityColors = {
    critical: "bg-red-500/10 text-red-600 border-red-500/20",
    recommended: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    optional: "bg-blue-500/10 text-blue-600 border-blue-500/20"
  };

  return (
    <motion.div 
      variants={itemVariants}
      className="rounded-2xl border border-border/40 bg-muted/5 hover:bg-muted/10 transition-all duration-300 overflow-hidden"
    >
      <div 
        className="p-5 cursor-pointer flex items-center gap-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-sm">
          <Edit3 size={20} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{suggestion.clauseReference}</span>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border",
              priorityColors[suggestion.priority as keyof typeof priorityColors]
            )}>
              {suggestion.priority}
            </span>
          </div>
          <p className="text-sm font-bold text-foreground leading-snug">{suggestion.rationale}</p>
        </div>
        <div className="p-2 text-muted-foreground/40">
          <ChevronDown size={18} className={cn("transition-transform duration-300", expanded && "rotate-180")} />
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border/40"
          >
            <div className="p-5 space-y-4 bg-muted/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-500/60">Current Text</p>
                  <p className="text-xs text-muted-foreground line-through bg-red-500/5 p-3 rounded-xl border border-red-500/10 leading-relaxed italic">
                    {suggestion.currentText}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-green-500/60">Proposed Amendment</p>
                  <p className="text-xs font-bold text-foreground bg-green-500/5 p-3 rounded-xl border border-green-500/10 leading-relaxed">
                    {suggestion.suggestedText}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ContractPerspectiveAnalyzer({ documentContent, onClose }: { documentContent?: string; onClose?: () => void }) {
  const [content, setContent] = useState(documentContent || "");
  const [perspective, setPerspective] = useState<AnalysisPerspective>("neutral");
  const [analysis, setAnalysis] = useState<ContractAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const analyzeContract = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const res = await fetch("/api/contract-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, perspective }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Analysis failed");
      }
      const data: { analysis: ContractAnalysis } = await res.json();
      setAnalysis(data.analysis);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="w-full flex flex-col"
    >
      {/* Enhanced Header with Visual Hierarchy */}
      <div className="w-full mb-10 pt-8 px-1 border-b border-border/40">
        <div className="flex items-center justify-between gap-8 pb-6">
          <div className="flex items-start gap-4 flex-1">
            <div className="flex-shrink-0">
              <ToolIconLarge toolId="contract-analysis" />
            </div>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-tight">Contract Analyzer</h1>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">Multi-perspective</span>
              </div>
              <p className="text-base text-slate-600 dark:text-slate-400 font-medium max-w-lg leading-relaxed">
                Analyze contract risks, obligations, and fairness from different party perspectives
              </p>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-10 w-10 hover:bg-muted flex-shrink-0">
              <XCircle size={20} className="text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Input/Selection Side */}
        <div className="lg:col-span-5 space-y-10">
          <section className="space-y-5">
            <div className="flex items-center gap-3 px-0">
              <div className="h-2 w-1 bg-gradient-to-b from-indigo-500 to-indigo-400 rounded-full" />
              <h2 className="text-xs uppercase font-bold tracking-widest text-slate-700 dark:text-slate-300">Analysis Lens</h2>
            </div>
            <div className="p-6 rounded-3xl bg-white/30 dark:bg-slate-900/30 shadow-sm">
              <PerspectiveSelector
                value={perspective}
                onChange={setPerspective}
                disabled={loading}
              />
            </div>
          </section>

          <section className="space-y-5">
            <div className="flex items-center gap-3 px-0">
              <div className="h-2 w-1 bg-gradient-to-b from-purple-500 to-purple-400 rounded-full" />
              <h2 className="text-xs uppercase font-bold tracking-widest text-slate-700 dark:text-slate-300">Contract Source</h2>
            </div>
            <div className="p-6 rounded-3xl bg-white/30 dark:bg-slate-900/30 shadow-sm space-y-6">
              <DocumentDropzone 
                onDocumentLoaded={(text, metadata) => {
                  setContent(text);
                  setUploadedFileName(metadata.fileName);
                }}
                disabled={loading}
                variant="compact"
              />
              
              <div className="relative my-4 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/40" />
                </div>
                <span className="relative px-4 bg-background text-xs font-medium text-muted-foreground">or paste text</span>
              </div>

              <div className="relative">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste agreement text here..."
                  className="w-full h-64 p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none shadow-inner"
                  disabled={loading}
                />
                <div className="absolute bottom-4 right-6 text-[10px] font-black text-slate-400/20 uppercase tracking-widest">
                  {content.length.toLocaleString()} Chars
                </div>
              </div>
              
              <Button 
                onClick={analyzeContract}
                disabled={!content.trim() || loading}
                className="w-full h-14 rounded-2xl font-bold text-lg shadow-sm transition-all"
                size="lg"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="animate-spin" size={20} />
                    Analyzing Perspective...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Scale size={20} />
                    Analyze Agreement
                  </span>
                )}
              </Button>
            </div>
          </section>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-3"
            >
              <AlertCircle size={18} />
              {error}
            </motion.div>
          )}
        </div>

        {/* Results Side */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {analysis ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-stretch">
                  <RiskScoreCircle score={analysis.riskScore} />
                  <div className="p-8 rounded-3xl bg-white/50 dark:bg-slate-900/50 shadow-sm flex flex-col justify-center space-y-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Perspective</p>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white capitalize">{analysis.perspective} POV</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">This analysis is calibrated to identify advantages and risks specifically for {analysis.perspective}.</p>
                    </div>
                    <div className="pt-4 border-t border-border/40">
                      <p className="text-xs font-medium text-muted-foreground mb-3">Switch Perspective:</p>
                      <div className="flex flex-wrap gap-2">
                        {(["party_a", "party_b", "neutral"] as AnalysisPerspective[]).map((p) => (
                          <Button
                            key={p}
                            variant={perspective === p ? "default" : "outline"}
                            size="sm"
                            onClick={async () => {
                              if (perspective !== p && content.trim()) {
                                setLoading(true);
                                setError(null);
                                try {
                                  const res = await fetch("/api/contract-analysis", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ content, perspective: p }),
                                  });
                                  if (!res.ok) {
                                    const err = await res.json();
                                    throw new Error(err.message || "Analysis failed");
                                  }
                                  const data: { analysis: ContractAnalysis } = await res.json();
                                  setAnalysis(data.analysis);
                                  setPerspective(p);
                                } catch (err: any) {
                                  setError(err.message);
                                } finally {
                                  setLoading(false);
                                }
                              }
                            }}
                            disabled={loading || perspective === p}
                            className="text-xs capitalize"
                          >
                            {p === "party_a" ? "Party A" : p === "party_b" ? "Party B" : "Neutral"}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Executive Summary Island */}
                <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-50/50 to-indigo-100/30 dark:from-indigo-900/20 dark:to-indigo-800/10 border border-indigo-200/50 dark:border-indigo-800/30 space-y-5 relative overflow-hidden">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <FileText size={20} />
                    </div>
                    <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-700 dark:text-indigo-300">Executive Summary</h2>
                  </div>
                  <p className="text-base font-medium leading-relaxed text-slate-900 dark:text-slate-100">
                    {analysis.summary}
                  </p>
                </div>
                
                {analysis.clauses && analysis.clauses.length > 0 && (
                  <div className="space-y-6 pt-4 border-t border-border/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-1 bg-gradient-to-b from-emerald-500 to-emerald-400 rounded-full" />
                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">Clause Breakdown</h2>
                      </div>
                       <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-500/20">{analysis.clauses.length} Clauses</span>
                    </div>
                    <div className="grid gap-4">
                       {analysis.clauses.map((clause, idx) => (
                          <ClauseCard key={idx} clause={clause} type="favorable" /> // Assuming type or logic to determine favorable/risky
                       ))}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {analysis.modificationSuggestions && analysis.modificationSuggestions.length > 0 && (
                  <section className="space-y-6 pt-4 border-t border-border/40">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-1 bg-gradient-to-b from-amber-500 to-amber-400 rounded-full" />
                      <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">Strategic Modifications</h2>
                      <span className="ml-auto px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-500/20">{analysis.modificationSuggestions.length} Suggestions</span>
                    </div>
                    <div className="grid gap-6">
                      {analysis.modificationSuggestions.map((suggestion, idx: number) => (
                        <SuggestionCard key={idx} suggestion={suggestion} />
                      ))}
                    </div>
                  </section>
                )}
                
                <div className="pt-6 flex gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setAnalysis(null);
                      setPerspective("neutral");
                    }}
                    className="flex-1 h-14 rounded-2xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 font-bold tracking-tight text-sm uppercase text-slate-600 dark:text-slate-400"
                  >
                    New Analysis
                  </Button>
                  {uploadedFileName && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 text-xs text-muted-foreground">
                      <FileText size={14} />
                      <span className="truncate max-w-[200px]">{uploadedFileName}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12 rounded-[2.5rem] bg-slate-50/50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800"
              >
                <div className="p-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mb-8">
                  <FileSearch size={72} className="text-slate-300 dark:text-slate-600" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4">System Initialized</h3>
                <p className="text-slate-500 text-lg font-medium max-w-md opacity-80">Upload your agreement or paste the text in the calibration panel to execute a multi-perspective analysis.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}