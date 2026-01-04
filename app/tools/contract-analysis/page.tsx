"use client";

import dynamic from "next/dynamic";
import { Loader2, Scale } from "lucide-react";

// Dynamic import with loading state for faster initial page load
const ContractPerspectiveAnalyzer = dynamic(
  () => import("@/components/ContractPerspectiveAnalyzerReorganized"),
  {
    loading: () => (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl overflow-hidden">
        <div className="relative p-4 text-white">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
          <div className="relative flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Scale size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Contract Perspective Analyzer</h2>
              <p className="text-blue-100 text-sm">Loading...</p>
            </div>
          </div>
        </div>
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
      </div>
    ),
    ssr: false, // Client-only component
  }
);

export default function ContractAnalysisPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <ContractPerspectiveAnalyzer />
    </div>
  );
}
