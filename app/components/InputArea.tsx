"use client";

import { Send, Paperclip, GraduationCap, Scale, Sparkles, Wand2, X, FileText, Loader2 } from "lucide-react";
import { useChat } from "../context/ChatContext";
import { useRef, useEffect, useState, useCallback } from "react";
import type { KeyboardEvent, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Premium Input Area Component
 * - Elegant design with smooth animations
 * - Professional legal aesthetic
 * - Enhanced user experience
 */
export default function InputArea() {
  const {
    inputMessage,
    setInputMessage,
    isLoading,
    mode,
    eliLevel,
    sendMessage,
    pendingAttachment,
    setPendingAttachment
  } = useChat();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, [inputMessage, pendingAttachment]); // Resize when attachment added/removed

  const processFile = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      alert("File too large. Max 20MB.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      // Use the existing upload API
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");
      
      const data = await response.json();
      
      setPendingAttachment({
        file,
        content: data.text,
        metadata: {
          fileName: data.metadata.fileName,
          fileSize: data.metadata.fileSize,
          fileType: data.metadata.fileType,
          isScanned: data.metadata.isScanned,
          ocrConfidence: data.metadata.ocrConfidence
        }
      });
    } catch (error) {
      console.error("File upload error:", error);
      alert("Failed to process file.");
    } finally {
      setIsUploading(false);
      setIsDragging(false);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file) processFile(file);
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) setIsDragging(true);
  }, [isLoading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only disable if we're actually leaving the container, not just entering a child
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isLoading) return;
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file) processFile(file);
    }
  }, [isLoading]);

  // Handle Enter key to send message (Shift+Enter for new line)
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
  };

  return (
    <motion.footer 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="z-40 bg-white/50 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800"
    >
      <div className="container mx-auto px-4 lg:px-8 py-4">
        <div className="max-w-4xl mx-auto">
          {/* Enhanced Input Container */}
          <motion.div 
            className={`relative flex flex-col glass-card rounded-2xl overflow-hidden transition-all duration-300 ${
              isFocused || isDragging ? 'ring-2 ring-blue-500/50 shadow-xl shadow-blue-500/10' : ''
            }`}
            animate={{ scale: isFocused || isDragging ? 1.01 : 1 }}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragEnter} // Use same as Enter to keep active
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Drag Overlay */}
            <AnimatePresence>
              {isDragging && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-blue-500/10 backdrop-blur-sm flex items-center justify-center border-2 border-dashed border-blue-500 rounded-2xl"
                >
                  <p className="text-blue-500 font-semibold flex items-center gap-2">
                    <Paperclip size={20} /> Drop file here
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Pending Attachment Indicator */}
            <AnimatePresence>
              {(pendingAttachment || isUploading) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pt-3"
                >
                  <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700 w-fit max-w-full">
                    <div className="h-8 w-8 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                      {isUploading ? (
                        <Loader2 size={16} className="text-blue-600 dark:text-blue-400 animate-spin" />
                      ) : (
                        <FileText size={16} className="text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-xs font-medium truncate max-w-[200px] text-slate-700 dark:text-slate-200">
                        {isUploading ? "Processing..." : pendingAttachment?.metadata.fileName}
                      </p>
                      {!isUploading && (
                        <p className="text-[10px] text-slate-500">
                          {Math.round((pendingAttachment?.metadata.fileSize || 0) / 1024)}KB
                        </p>
                      )}
                    </div>
                    {!isUploading && (
                      <button 
                        onClick={() => setPendingAttachment(null)}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-end gap-2 relative">
            {/* Gradient accent bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-indigo-500 to-cyan-500 transition-opacity duration-300 ${isFocused ? 'opacity-100' : 'opacity-0'}`} />
            
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              accept=".pdf,.docx,.txt"
            />

            
            <textarea
              ref={textareaRef}
              className="flex-1 min-h-[60px] max-h-[200px] px-5 py-4 bg-transparent resize-none outline-none text-[15px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 relative z-10"
              placeholder={mode === "student" 
                ? "Ask a legal question with simplified explanations..." 
                : "Ask me about South African law, case law, or legal principles..."}
              value={inputMessage}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={isLoading}
              aria-label="Type your message here"
              rows={1}
              aria-busy={isLoading}
            />
            
            <div className="flex items-center gap-1 pr-3 pb-3 relative z-10">
              {/* Attach Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 group"
                disabled={isLoading || isUploading}
                title="Attach document"
              >
                <Paperclip size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
              </motion.button>
              
              {/* Send Button */}
              <motion.button
                whileHover={inputMessage.trim() && !isLoading ? { scale: 1.05 } : {}}
                whileTap={inputMessage.trim() && !isLoading ? { scale: 0.95 } : {}}
                onClick={() => sendMessage()}
                className={`p-2.5 rounded-xl transition-all duration-300 ${
                  inputMessage.trim() && !isLoading
                    ? "bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                }`}
                disabled={!inputMessage.trim() || isLoading}
                aria-label="Send message"
                title={inputMessage.trim() && !isLoading ? "Send message" : "Type a message to send"}
              >
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, rotate: -90 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: 90 }}
                    >
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="send"
                      initial={{ opacity: 0, rotate: 90 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: -90 }}
                    >
                      <Send size={18} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
              </div>
            </div>
          </motion.div>
          
          {/* Footer Info */}
          <div className="mt-3 px-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              {mode === "student" ? (
                <>
                  <GraduationCap className="h-3.5 w-3.5 text-purple-500" />
                  <span>Student Mode: {eliLevel} explanations</span>
                </>
              ) : (
                <>
                  <Scale className="h-3.5 w-3.5 text-blue-500" />
                  <span>Verified South African legal sources</span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
                Enter
              </kbd>
              <span>to send</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px] ml-2">
                Shift + Enter
              </kbd>
              <span>for new line</span>
            </div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
