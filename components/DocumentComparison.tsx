"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitCompare,
  Plus,
  Minus,
  Edit3,
  Loader2,
  AlertCircle,
  ChevronDown,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DocumentDropzone from "@/components/DocumentDropzone";
import DocumentChat from "@/components/DocumentChat";
import { cn } from "@/lib/utils";
import { ToolIconLarge } from "@/components/ui/tool-icons";

// ============================================
// Types
// ============================================

interface DiffSegment {
  type: "unchanged" | "added" | "removed" | "modified";
  lineNumber: { doc1?: number; doc2?: number };
  content: string;
  originalContent?: string;
}

interface ClauseDiff {
  clauseNumber: string;
  clauseTitle?: string;
  status: "unchanged" | "added" | "removed" | "modified";
  doc1Content?: string;
  doc2Content?: string;
}

interface ComparisonReport {
  summary: {
    totalChanges: number;
    additions: number;
    deletions: number;
    modifications: number;
    similarityScore: number;
  };
  lineDiffs: DiffSegment[];
  clauseDiffs?: ClauseDiff[];
  keyDifferences: string[];
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
// Diff Line Component
// ============================================

function DiffLine({ segment }: { segment: DiffSegment }) {
  const config = {
    unchanged: { bg: "bg-muted/30", text: "text-muted-foreground", icon: null },
    added: { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-700 dark:text-green-400", icon: Plus },
    removed: { bg: "bg-destructive/5", text: "text-destructive", icon: Minus },
    modified: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-400", icon: Edit3 },
  };

  const { bg, text, icon: Icon } = config[segment.type];

  if (segment.type === "unchanged") return null;

  return (
    <div className={cn("flex items-start gap-2 px-3 py-1 font-mono text-sm", bg)}>
      <div className="w-16 shrink-0 text-xs text-muted-foreground">
        {segment.lineNumber.doc1 && <span>L{segment.lineNumber.doc1}</span>}
        {segment.lineNumber.doc1 && segment.lineNumber.doc2 && " → "}
        {segment.lineNumber.doc2 && <span>L{segment.lineNumber.doc2}</span>}
      </div>
      {Icon && <Icon size={14} className={cn(text, "mt-0.5 shrink-0")} />}
      <div className={cn("flex-1", text)}>
        {segment.type === "modified" && segment.originalContent && (
          <div className="line-through text-destructive/70 mb-1">
            {segment.originalContent}
          </div>
        )}
        <div>{segment.content || "(empty line)"}</div>
      </div>
    </div>
  );
}

// ============================================
// Clause Diff Card
// ============================================

function ClauseDiffCard({ clause }: { clause: ClauseDiff }) {
  const [expanded, setExpanded] = useState(false);

  const statusConfig = {
    unchanged: { color: "text-muted-foreground", bg: "bg-muted/30", border: "border-border", label: "Unchanged" },
    added: { color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/10", border: "border-green-200 dark:border-green-800/50", label: "Added" },
    removed: { color: "text-destructive", bg: "bg-destructive/5", border: "border-destructive/20", label: "Removed" },
    modified: { color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/10", border: "border-amber-200 dark:border-amber-800/50", label: "Modified" },
  };

  const { color, bg, border, label } = statusConfig[clause.status];

  if (clause.status === "unchanged") return null;

  return (
    <motion.div variants={itemVariants} layout className={cn("rounded-xl border overflow-hidden", border, bg)}>
      <div
        className="p-4 cursor-pointer flex items-center justify-between hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className={cn("font-mono font-bold", color)}>{clause.clauseNumber}</span>
          {clause.clauseTitle && (
            <span className="text-foreground">{clause.clauseTitle}</span>
          )}
          <span className={cn("text-xs px-2 py-0.5 rounded-full border", border, color)}>{label}</span>
        </div>
        <motion.button className="p-1 text-muted-foreground" animate={{ rotate: expanded ? 180 : 0 }}>
          <ChevronDown size={16} />
        </motion.button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border"
          >
            {clause.status === "modified" && (
              <div className="grid grid-cols-2 divide-x divide-border">
                <div className="p-4">
                  <p className="text-xs font-medium text-destructive mb-2">Original</p>
                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {clause.doc1Content}
                  </pre>
                </div>
                <div className="p-4">
                  <p className="text-xs font-medium text-green-600 mb-2">New</p>
                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {clause.doc2Content}
                  </pre>
                </div>
              </div>
            )}
            {clause.status === "added" && (
              <div className="p-4">
                <pre className="text-sm text-green-700 dark:text-green-400 whitespace-pre-wrap">
                  {clause.doc2Content}
                </pre>
              </div>
            )}
            {clause.status === "removed" && (
              <div className="p-4">
                <pre className="text-sm text-destructive whitespace-pre-wrap">
                  {clause.doc1Content}
                </pre>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// Main Component
// ============================================

interface DocumentComparisonProps {
  onClose?: () => void;
}

export default function DocumentComparison({ onClose }: DocumentComparisonProps) {
  const [doc1, setDoc1] = useState("");
  const [doc2, setDoc2] = useState("");
  const [doc1FileName, setDoc1FileName] = useState<string | null>(null);
  const [doc2FileName, setDoc2FileName] = useState<string | null>(null);
  const [report, setReport] = useState<ComparisonReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"lines" | "clauses">("clauses");
  const [showChat, setShowChat] = useState(false);
  const [chatDocument, setChatDocument] = useState<"doc1" | "doc2">("doc2");

  const handleDoc1Loaded = (text: string, metadata: { fileName: string }) => {
    setDoc1(text);
    setDoc1FileName(metadata.fileName);
    setError(null);
  };

  const handleDoc2Loaded = (text: string, metadata: { fileName: string }) => {
    setDoc2(text);
    setDoc2FileName(metadata.fileName);
    setError(null);
  };

  const compareDocuments = async () => {
    if (!doc1.trim() || !doc2.trim()) return;

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document1: doc1, document2: doc2 }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Comparison failed");
      }

      const data = await res.json();
      setReport(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
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
      {/* Header Island */}
      {/* Minimal Header */}
      <div className="w-full mb-8 pt-6 px-1">
        <div className="flex items-center gap-5">
          <ToolIconLarge toolId="compare" />
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Document Comparison</h1>
            <p className="text-muted-foreground text-sm font-medium">Analyze differences between two contract versions</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {!report ? (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Document 1 */}
              <motion.div variants={itemVariants} className="space-y-4">
                <label className="block text-sm font-medium text-foreground">
                  Original Document
                </label>
                <DocumentDropzone
                  onDocumentLoaded={handleDoc1Loaded}
                  onError={(err) => setError(err)}
                  disabled={loading}
                  variant="compact"
                  className="mb-4"
                />
                <div className="relative my-4 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/40" />
                  </div>
                  <span className="relative px-4 bg-background text-xs font-medium text-muted-foreground">or paste text</span>
                </div>
                <div>
                  {doc1FileName && (
                    <p className="text-xs text-green-600 dark:text-green-400 mb-2 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                      {doc1FileName}
                    </p>
                  )}
                  <textarea
                  value={doc1}
                  onChange={(e) => {
                    setDoc1(e.target.value);
                    setDoc1FileName(null);
                  }}
                  placeholder="Paste the original document..."
                                    className="w-full h-48 px-4 py-3 border border-border/40 rounded-2xl bg-muted/10 text-foreground resize-none text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all shadow-inner"
                  disabled={loading}
                />
                </div>
              </motion.div>

              {/* Document 2 */}
              <motion.div variants={itemVariants} className="space-y-4">
                <label className="block text-sm font-medium text-foreground">
                  New Document
                </label>
                <DocumentDropzone
                  onDocumentLoaded={handleDoc2Loaded}
                  onError={(err) => setError(err)}
                  disabled={loading}
                  variant="compact"
                  className="mb-4"
                />
                <div className="relative my-4 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/40" />
                  </div>
                  <span className="relative px-4 bg-background text-xs font-medium text-muted-foreground">or paste text</span>
                </div>
                <div>
                  {doc2FileName && (
                    <p className="text-xs text-green-600 dark:text-green-400 mb-2 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                      {doc2FileName}
                    </p>
                  )}
                <textarea
                  value={doc2}
                  onChange={(e) => {
                    setDoc2(e.target.value);
                    setDoc2FileName(null);
                  }}
                  placeholder="Paste the new/modified document..."
                                    className="w-full h-48 px-4 py-3 border border-border/40 rounded-2xl bg-muted/10 text-foreground resize-none text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all shadow-inner"
                  disabled={loading}
                />
                </div>
              </motion.div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="p-4 bg-destructive/10 text-destructive rounded-xl flex items-center gap-3 border border-destructive/20"
              >
                <AlertCircle size={18} />
                {error}
              </motion.div>
            )}

            <div className="md:col-span-2">
              <Button
                onClick={compareDocuments}
                disabled={!doc1.trim() || !doc2.trim() || loading}
                className="w-full h-14 rounded-2xl font-bold shadow-sm transition-all"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Processing documents...
                  </>
                ) : (
                  <>
                    <GitCompare className="mr-2" size={20} />
                    Analyze & Compare
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            {/* Summary */}
            <motion.div variants={itemVariants} className="grid grid-cols-4 gap-3">
              <div className="p-4 glass-card text-center shadow-sm">
                <p className="text-2xl font-bold text-primary">{report.summary.similarityScore}%</p>
                <p className="text-xs text-primary">Similarity</p>
              </div>
              <div className="p-4 glass-card text-center shadow-sm">
                <p className="text-2xl font-bold text-green-600">{report.summary.additions}</p>
                <p className="text-xs text-green-600">Additions</p>
              </div>
              <div className="p-4 glass-card text-center shadow-sm">
                <p className="text-2xl font-bold text-destructive">{report.summary.deletions}</p>
                <p className="text-xs text-destructive">Deletions</p>
              </div>
              <div className="p-4 glass-card text-center shadow-sm">
                <p className="text-2xl font-bold text-amber-600">{report.summary.modifications}</p>
                <p className="text-xs text-amber-600">Modifications</p>
              </div>
            </motion.div>

            {/* Key Differences */}
            {report.keyDifferences.length > 0 && (
              <motion.div variants={itemVariants} className="p-4 glass-card">
                <p className="font-medium text-foreground mb-2 flex items-center gap-2">
                  <Sparkles size={16} className="text-primary" />
                  Key Differences
                </p>
                <ul className="space-y-1">
                  {report.keyDifferences.map((diff, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="text-primary">•</span>
                      {diff}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* View Mode Toggle */}
            {(() => {
              const hasClauseDiffs = report.clauseDiffs && report.clauseDiffs.filter(c => c.status !== "unchanged").length > 0;
              const hasLineDiffs = report.lineDiffs.filter(d => d.type !== "unchanged").length > 0;
              
              return (
                <>
                  {hasClauseDiffs && (
                    <motion.div variants={itemVariants} className="flex gap-2">
                      <Button
                        variant={viewMode === "clauses" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("clauses")}
                        className="rounded-lg"
                      >
                        Clause View
                      </Button>
                      <Button
                        variant={viewMode === "lines" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("lines")}
                        className="rounded-lg"
                      >
                        Line View
                      </Button>
                    </motion.div>
                  )}

                  {/* Clause Diffs */}
                  {viewMode === "clauses" && hasClauseDiffs && report.clauseDiffs && (
                    <motion.div variants={itemVariants}>
                      <p className="font-medium text-foreground mb-3">
                        Clause Changes ({report.clauseDiffs.filter(c => c.status !== "unchanged").length})
                      </p>
                      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-2">
                        {report.clauseDiffs.map((clause, idx) => (
                          <ClauseDiffCard key={idx} clause={clause} />
                        ))}
                      </motion.div>
                    </motion.div>
                  )}

                  {/* Line Diffs - Show when in lines mode OR when no clause diffs available */}
                  {(viewMode === "lines" || !hasClauseDiffs) && (
                    <motion.div variants={itemVariants}>
                      <p className="font-medium text-foreground mb-3">
                        Line-by-Line Changes
                      </p>
                      {hasLineDiffs ? (
                        <div className="border border-border rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                          {report.lineDiffs.map((segment, idx) => (
                            <DiffLine key={idx} segment={segment} />
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-muted-foreground border border-border rounded-xl bg-muted/20">
                          <p>No differences found between the documents.</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </>
              );
            })()}

            {/* New Comparison Button */}
            <motion.div variants={itemVariants} className="space-y-3">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setChatDocument("doc1");
                    setShowChat(!showChat || chatDocument !== "doc1");
                  }}
                  className={cn(
                    "flex-1 h-11 rounded-xl border-primary/30 hover:bg-primary/5",
                    showChat && chatDocument === "doc1" && "bg-primary/10"
                  )}
                >
                  <MessageSquare className="mr-2" size={16} />
                  Chat Original
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setChatDocument("doc2");
                    setShowChat(!showChat || chatDocument !== "doc2");
                  }}
                  className={cn(
                    "flex-1 h-11 rounded-xl border-primary/30 hover:bg-primary/5",
                    showChat && chatDocument === "doc2" && "bg-primary/10"
                  )}
                >
                  <MessageSquare className="mr-2" size={16} />
                  Chat New
                </Button>
              </div>
              
              <Button
                variant="outline"
                onClick={() => {
                  setReport(null);
                  setDoc1("");
                  setDoc2("");
                  setDoc1FileName(null);
                  setDoc2FileName(null);
                  setShowChat(false);
                }}
                className="w-full h-11 rounded-xl border-border hover:bg-muted/50"
              >
                Compare Other Documents
              </Button>
            </motion.div>

            {/* Document Chat Panel */}
            <AnimatePresence>
              {showChat && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <DocumentChat
                    documentContent={chatDocument === "doc1" ? doc1 : doc2}
                    documentName={chatDocument === "doc1" ? (doc1FileName || "Original Document") : (doc2FileName || "New Document")}
                    onClose={() => setShowChat(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
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
