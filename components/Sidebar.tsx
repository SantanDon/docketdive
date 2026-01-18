"use client";

import { useState, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  GraduationCap,
  MessageSquare,
  X,
  MoreVertical
} from "lucide-react";
import { ModeToggle } from "@/components/ModeToggle";
import { useChat } from "@/app/context/ChatContext";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isMobile: boolean;
}

export default function Sidebar({ sidebarOpen, setSidebarOpen, isMobile }: SidebarProps) {
  const {
    conversations,
    setConversations,
    setMessages,
    mode,
    eliLevel,
    newChat,
    toggleStudentMode,
    loadConversation,
    deleteConversation
  } = useChat();

  const handleClearData = () => {
    if (
      confirm(
        "Are you sure you want to clear all data? This will delete all conversations and messages.",
      )
    ) {
      localStorage.removeItem("conversations");
      localStorage.removeItem("current_messages");
      setConversations([]);
      setMessages([]);
      alert("All data cleared successfully!");
    }
  };

  return (
    <>
      {(!isMobile || sidebarOpen) && (
        <>
          <aside
            className={`w-64 bg-background border-r flex flex-col z-50 transition-all duration-300 ${isMobile ? "fixed inset-0 h-full" : "relative"
              }`}
          >
            <div className="p-5 flex flex-col gap-6">
              {/* Logo / Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-sm font-semibold tracking-tight">DocketDive</h1>
                  </div>
                </div>
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(false)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Utility Nav */}
              <nav className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-9 text-sm font-medium hover:bg-muted"
                  onClick={() => {
                    newChat();
                    if (isMobile) setSidebarOpen(false);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  New Chat
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-9 text-sm font-medium hover:bg-muted"
                >
                  <MessageSquare className="h-4 w-4" />
                  Overview
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-9 text-sm font-medium hover:bg-muted"
                >
                  <GraduationCap className="h-4 w-4" />
                  Data Room
                </Button>
              </nav>
            </div>

            {/* Session History Section */}
            <div className="flex-1 overflow-auto px-3 py-2">
              <div className="px-2 mb-2">
                <h3 className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Recent Sessions</h3>
              </div>

              {conversations.length === 0 ? (
                <div className="px-2 py-4 text-xs text-muted-foreground italic">
                  No active sessions
                </div>
              ) : (
                <div className="space-y-0.5">
                  {conversations.slice(0, 15).map((conv) => (
                    <div
                      key={conv.id}
                      className="group relative flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => {
                        loadConversation(conv.id);
                        if (isMobile) setSidebarOpen(false);
                      }}
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-muted-foreground/70" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate text-foreground/80">{conv.title}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Delete session?")) {
                            deleteConversation(conv.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Utilities */}
            <div className="p-4 border-t border-border/50 flex flex-col gap-1">
               <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-9 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Get Help
                </Button>
              <div className="flex items-center justify-between px-2 pt-2">
                <ModeToggle />
                <span className="text-[10px] font-semibold text-muted-foreground/50 tracking-widest uppercase">
                  V 1.0.4
                </span>
              </div>
            </div>
          </aside>

          {isMobile && sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </>
      )}
    </>
  );
}