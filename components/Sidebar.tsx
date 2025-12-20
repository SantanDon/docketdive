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
            className={`w-64 bg-card border-r flex flex-col z-50 transition-all duration-300 ${isMobile ? "fixed inset-0 h-full" : "relative"
              }`}
          >
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="bg-gradient-to-br from-legal-blue-600 to-justice-600 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">DocketDive</h1>
                    <p className="text-xs text-muted-foreground">AI Legal Assistant</p>
                  </div>
                </div>
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="p-4 flex flex-col gap-3">
              <Button
                className="w-full justify-start"
                onClick={() => {
                  newChat();
                  if (isMobile) setSidebarOpen(false);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>

              {mode === "student" && (
                <div className="p-3 rounded-lg bg-secondary/50 border flex items-center justify-between">
                  <div className="flex items-center">
                    <GraduationCap className="h-4 w-4 mr-2 text-amber-600" />
                    <div>
                      <div className="text-sm font-medium">Student Mode</div>
                      <div className="text-xs text-muted-foreground">{eliLevel}</div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleStudentMode}
                    className="h-auto p-1 text-xs"
                  >
                    Exit
                  </Button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-auto p-2">
              <div className="flex items-center justify-between px-2 mb-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Chats</h3>
                {conversations.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearData}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    title="Clear all history"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {conversations.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center h-40">
                  <div className="bg-muted rounded-full p-3 mb-3">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No chats yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Start a new conversation to get legal assistance</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {conversations.slice(0, 20).map((conv) => (
                    <div
                      key={conv.id}
                      className="group relative flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => {
                        loadConversation(conv.id);
                        if (isMobile) setSidebarOpen(false);
                      }}
                    >
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate text-foreground">{conv.title}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {new Date(conv.date).toLocaleDateString()}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Delete this conversation?")) {
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

            <div className="p-4 border-t">
              <div className="flex items-center justify-between">
                <ModeToggle />
                <div className="text-xs text-muted-foreground">
                  South African Law
                </div>
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