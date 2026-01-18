"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  FileText, 
  ArrowRight,
  Shield,
  Search,
  CheckCircle2,
  Lock,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DocumentDropzone from "@/components/DocumentDropzone";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ComplianceReport, Requirement } from "@/types/legal-tools";

interface POPIACheckerProps {
  documentContent?: string;
  onClose?: () => void;
}

export default function POPIAChecker({ documentContent, onClose }: POPIACheckerProps) {
  const [content, setContent] = useState(documentContent || "");
  const [documentType, setDocumentType] = useState<string>("");
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);

  const checkCompliance = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const res = await fetch("/api/popia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, documentType }),
      });
      if (!res.ok) throw new Error("Analysis failed");
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
    <div className="w-full flex flex-col gap-12 py-8">
      {/* Tool Header */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 bg-muted/30 px-2 py-0.5 rounded">
            Compliance / Privacy
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          POPIA <span className="text-primary/60 font-medium">Audit & Compliance</span>
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed opacity-80">
          Verify South African POPI Act alignment with automated clause auditing and remediation guidance.
        </p>
      </div>

      {!report ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-12"
        >
          {/* Config Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4 space-y-8">
              {/* Task Checklist */}
              <div className="p-6 rounded-2xl bg-muted/5 border border-border/40 space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 px-1">Audit Workflow</h4>
                <div className="space-y-3">
                  {[
                    { label: "Upload Document", done: !!content },
                    { label: "Select Document Type", done: !!documentType },
                    { label: "Run Compliance Audit", done: false },
                    { label: "Review Findings", done: false },
                  ].map((task, i) => (
                    <div key={i} className="flex items-center gap-3 px-1">
                      <div className={cn(
                        "h-4 w-4 rounded border flex items-center justify-center transition-colors",
                        task.done ? "bg-primary border-primary text-primary-foreground" : "bg-background border-border"
                      )}>
                        {task.done && <CheckCircle2 size={10} />}
                      </div>
                      <span className={cn("text-[11px] font-medium", task.done ? "text-foreground" : "text-muted-foreground/60")}>
                        {task.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-2 px-1">
                  <div className="h-1 w-6 bg-primary rounded-full opacity-60" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Audit Settings</h3>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Document Nature</label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full bg-muted/10 border border-border/40 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                  >
                    <option value="">Select Document Type</option>
                    <option value="privacy_policy">Privacy Policy</option>
                    <option value="data_processing_agreement">DPA / Operator Agreement</option>
                    <option value="consent_form">Consent Form</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Upload Source</label>
                  <DocumentDropzone
                    onDocumentLoaded={(text, meta) => {
                      setContent(text);
                      setUploadedFileName(meta.fileName);
                    }}
                    variant="compact"
                  />
                  {uploadedFileName && (
                    <div className="px-3 py-1.5 rounded-lg bg-green-500/5 border border-green-500/10 text-[9px] font-bold text-green-600/80 uppercase tracking-widest mt-2 flex items-center gap-2">
                       <div className="h-1 w-1 rounded-full bg-green-500 animate-pulse" />
                       {uploadedFileName}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-4">
              <div className="relative group">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste document text here..."
                  className="w-full h-[400px] p-6 rounded-2xl bg-background/50 border border-border/40 text-foreground text-sm font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none resize-none transition-all leading-relaxed"
                />
                <div className="absolute bottom-4 right-6 text-[9px] font-bold text-muted-foreground/20 uppercase tracking-widest">
                  {content.length.toLocaleString()} Chars
                </div>
              </div>
              <Button
                onClick={checkCompliance}
                disabled={loading || !content.trim() || !documentType}
                className="w-full h-14 rounded-2xl text-lg font-bold shadow-sm"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span className="text-sm uppercase tracking-widest">Scanning...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" />
                    <span className="text-sm uppercase tracking-widest">Run Analysis</span>
                  </div>
                )}
              </Button>
              {error && <div className="p-3 bg-destructive/5 text-destructive/80 text-[11px] font-bold rounded-xl border border-destructive/10 flex items-center gap-2"><AlertTriangle size={14}/> {error}</div>}
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          {/* Header Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-3xl bg-muted/20 border border-border/40 flex flex-col items-center justify-center text-center space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Audit Profile</span>
              <p className="font-bold text-foreground">{documentTypeNames[documentType] || "General"}</p>
            </div>
            <div className="p-8 rounded-3xl bg-muted/20 border border-border/40 flex flex-col items-center justify-center text-center space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Compliance Score</span>
              <p className={cn(
                "text-4xl font-extrabold tracking-tighter",
                report.overallScore >= 80 ? "text-green-500" : report.overallScore >= 50 ? "text-amber-500" : "text-red-500"
              )}>
                {report.overallScore}%
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-muted/20 border border-border/40 flex flex-col items-center justify-center text-center space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Security Rating</span>
              <div className="flex items-center gap-1 text-green-500">
                <ShieldCheck size={20} />
                <span className="font-bold uppercase tracking-widest text-xs">Standard</span>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <div className="h-1 w-6 bg-primary rounded-full" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">Findings & Gap Analysis</h3>
            </div>
            
            <div className="grid gap-4">
              {report.requirements.map((req, idx) => (
                <div key={idx} className="group p-6 rounded-2xl bg-muted/10 border border-border/40 hover:bg-muted/20 transition-all">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border",
                          req.status === "compliant" ? "bg-green-500/10 text-green-500 border-green-500/20" : 
                          req.status === "non-compliant" ? "bg-red-500/10 text-red-500 border-red-500/20" : 
                          "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        )}>
                          {req.status}
                        </span>
                        <h4 className="font-bold text-foreground">{req.name}</h4>
                      </div>
                      
                      <div className="prose-wilson prose-sm max-w-none text-muted-foreground">
                        <p>{req.description}</p>
                      </div>

                      {req.recommendation && (
                        <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1">
                            <ArrowRight size={10} /> Remediation Action
                          </p>
                          <p className="text-sm font-medium text-foreground">{req.recommendation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-8 flex flex-col sm:flex-row gap-4">
            <Button
              className="flex-1 h-14 rounded-2xl font-bold"
              onClick={() => { setReport(null); setContent(""); }}
            >
              Analyze New Document
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-14 rounded-2xl font-bold"
              onClick={() => setShowChat(!showChat)}
            >
              Consult Legal Advisor
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className={className}><Search size={20} /></motion.div>;
}
