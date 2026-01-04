"use client";

import { X, FileUp } from "lucide-react";
import DocumentUpload from "../../components/DocumentUpload";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modern Upload Modal
 * - Clean wrapper for DocumentUpload
 * - Consistent styling with LoginModal
 */
export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="bg-background dark:bg-background rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in border border-border">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-blue-600 to-cyan-600 p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <FileUp size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Upload Documents</h2>
                <p className="text-blue-100 text-sm">Add to your Knowledge Base</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-0">
            <DocumentUpload />
          </div>
        </div>
      </div>
    </div>
  );
}
