"use client";

import type { MessageSource } from "@/app/types";
import { BookOpen, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SourcePanelProps {
  sources: MessageSource[];
  isVisible: boolean;
  onClose: () => void;
}

export default function SourcePanel({ sources, isVisible, onClose }: SourcePanelProps) {
  if (!isVisible || sources.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Sources
          </h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            ×
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sources.map((source, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{source.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {source.citation && (
                    <div className="text-sm">
                      <span className="font-medium">Citation:</span> {source.citation}
                    </div>
                  )}
                  {source.category && (
                    <Badge variant="secondary" className="mr-2">
                      {source.category}
                    </Badge>
                  )}
                  {source.relevance && (
                    <Badge variant="outline">
                      Relevance: {source.relevance}%
                    </Badge>
                  )}
                </div>
                
                {source.url && (
                  <a 
                    href={source.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center text-primary hover:underline text-sm"
                  >
                    View Source
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}