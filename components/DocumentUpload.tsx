'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Loader2, Check, X, Zap, Database, Sparkles, FileSearch } from 'lucide-react';
import DocumentDropzone from '@/components/DocumentDropzone';
import { cn } from '@/lib/utils';

interface UploadedFile {
  text: string;
  metadata: {
    fileName: string;
    fileSize: number;
    fileType: string;
    pageCount: number;
    wordCount: number;
    charCount: number;
    isScanned?: boolean;
    ocrConfidence?: number;
  };
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

export default function DocumentUpload() {
  const [analyzing, setAnalyzing] = useState(false);
  const [addingToKB, setAddingToKB] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleDocumentLoaded = (text: string, metadata: { fileName: string; fileSize: number; fileType: string; pageCount: number; wordCount: number; charCount: number; isScanned?: boolean; ocrConfidence?: number }) => {
    setUploadedFile({ text, metadata });
    setSuccess(`Successfully extracted ${metadata.wordCount.toLocaleString()} words from ${metadata.fileName}`);
    setError(null);
    setAnalysis(null);
  };

  const handleUploadError = (errorMsg: string) => {
    setError(errorMsg);
    setSuccess(null);
  };

  const handleQuickAnalysis = async () => {
    if (!uploadedFile) return;

    setAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: uploadedFile.text,
          fileName: uploadedFile.metadata.fileName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setAnalysis(data.analysis);
      setSuccess(`Analysis completed in ${data.metadata.responseTime}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAddToKnowledgeBase = async () => {
    if (!uploadedFile) return;

    setAddingToKB(true);
    setError(null);

    try {
      const response = await fetch('/api/documents/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: uploadedFile.text,
          fileName: uploadedFile.metadata.fileName,
          metadata: {
            category: 'Legal Document',
            fileType: uploadedFile.metadata.fileType,
            pageCount: uploadedFile.metadata.pageCount,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add to knowledge base');
      }

      setSuccess(`Added ${data.chunksStored} chunks to knowledge base. You can now query this document!`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add to knowledge base');
    } finally {
      setAddingToKB(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleReset = () => {
    setUploadedFile(null);
    setAnalysis(null);
    setError(null);
    setSuccess(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-6"
    >
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4"
        >
          <FileSearch size={14} className="text-primary" />
          <span className="text-sm font-medium text-primary">Document Analysis</span>
        </motion.div>
        <h2 className="text-3xl font-bold text-gradient mb-2">Document Upload & Analysis</h2>
        <p className="text-muted-foreground">
          Upload legal documents for quick analysis or add them to your knowledge base
        </p>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Document Dropzone */}
        <motion.div variants={itemVariants}>
          <DocumentDropzone
            onDocumentLoaded={handleDocumentLoaded}
            onError={handleUploadError}
            disabled={analyzing || addingToKB}
          />
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-start p-4 bg-destructive/10 rounded-xl border border-destructive/20"
            >
              <X className="mr-3 text-destructive shrink-0 mt-0.5" size={18} />
              <span className="text-destructive">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Message */}
        <AnimatePresence>
          {success && !error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-start p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800"
            >
              <Check className="mr-3 text-green-600 dark:text-green-400 shrink-0 mt-0.5" size={18} />
              <span className="text-green-600 dark:text-green-400">{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Uploaded File Info */}
        <AnimatePresence>
          {uploadedFile && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-card p-6"
            >
              <div className="flex items-start mb-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg mr-4">
                  <FileText className="text-white" size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-2 truncate text-foreground">{uploadedFile.metadata.fileName}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <span>📄</span> {uploadedFile.metadata.pageCount} pages
                    </div>
                    <div className="flex items-center gap-1">
                      <span>📝</span> {uploadedFile.metadata.wordCount.toLocaleString()} words
                    </div>
                    <div className="flex items-center gap-1">
                      <span>💾</span> {formatBytes(uploadedFile.metadata.fileSize)}
                    </div>
                    <div className="flex items-center gap-1">
                      <span>🔤</span> {uploadedFile.metadata.charCount.toLocaleString()} chars
                    </div>
                  </div>
                  {uploadedFile.metadata.isScanned && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <Sparkles size={12} className="text-primary" />
                      <span className="text-muted-foreground">OCR processed</span>
                      {uploadedFile.metadata.ocrConfidence !== undefined && (
                        <span className={cn(
                          "px-2 py-0.5 rounded-full",
                          uploadedFile.metadata.ocrConfidence >= 70 
                            ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                            : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                        )}>
                          {uploadedFile.metadata.ocrConfidence}% confidence
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleQuickAnalysis}
                  disabled={analyzing || addingToKB}
                  className={cn(
                    "flex items-center px-5 py-2.5 rounded-xl font-medium transition-all",
                    "bg-gradient-to-r from-primary to-accent text-white",
                    "hover:opacity-90 shadow-lg hover:shadow-xl",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Quick Analysis
                    </>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddToKnowledgeBase}
                  disabled={analyzing || addingToKB}
                  className={cn(
                    "flex items-center px-5 py-2.5 rounded-xl font-medium transition-all",
                    "bg-gradient-to-r from-green-500 to-emerald-600 text-white",
                    "hover:opacity-90 shadow-lg hover:shadow-xl",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {addingToKB ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Add to Knowledge Base
                    </>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReset}
                  disabled={analyzing || addingToKB}
                  className={cn(
                    "flex items-center px-5 py-2.5 rounded-xl font-medium transition-all",
                    "border border-border bg-card text-foreground",
                    "hover:bg-muted/50",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analysis Results */}
        <AnimatePresence>
          {analysis && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Sparkles className="text-white" size={20} />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Analysis Results</h3>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed">{analysis}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
