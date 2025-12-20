"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Clock, Trash2, FileText, User } from "lucide-react";

export interface ConversationEntry {
  id: string;
  title: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  timestamp: string;
}

export default function ConversationHistoryTab({
  onLoad,
}: {
  onLoad: (entry: ConversationEntry) => void;
}) {
  const [history, setHistory] = useState<ConversationEntry[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const stored = JSON.parse(localStorage.getItem("conversations") ?? "[]");
    setHistory(stored);
  }, []);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } else if (days === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getMessageCount = (
    messages: Array<{ role: "user" | "assistant"; content: string }>,
  ) => {
    return messages?.length || 0;
  };

  if (!isClient) {
    return null; // or a loading skeleton
  }

  return (
    <div className="conversation-history-container" role="region" aria-label="Conversation history">
      <div className="conversation-history-header">
        <div className="header-icon" aria-hidden="true">
          <MessageSquare size={16} />
        </div>
        <h3 className="header-title">Conversation History</h3>
      </div>

      {history.length === 0 ? (
        <div className="empty-state" role="status">
          <div className="empty-icon" aria-hidden="true">
            <FileText size={24} />
          </div>
          <p className="empty-text">No conversations yet</p>
          <p className="empty-subtext">
            Start chatting to see your history here
          </p>
        </div>
      ) : (
        <div className="conversation-list" role="list">
          {history.map((h) => (
            <div key={h.id} className="conversation-item" role="listitem">
              <button 
                onClick={() => onLoad(h)} 
                className="conversation-button"
                aria-label={`Load conversation: ${h.title || "Untitled conversation"}`}
              >
                <div className="conversation-icon" aria-hidden="true">
                  <User size={16} />
                </div>
                <div className="conversation-content">
                  <div className="conversation-title" tabIndex={0}>
                    {h.title || "Untitled conversation"}
                  </div>
                  <div className="conversation-meta">
                    <div className="meta-item">
                      <Clock size={12} aria-hidden="true" />
                      <span>{formatTimestamp(h.timestamp)}</span>
                    </div>
                    <div className="meta-item">
                      <MessageSquare size={12} aria-hidden="true" />
                      <span>{getMessageCount(h.messages)} messages</span>
                    </div>
                  </div>
                </div>
                <div className="conversation-actions" role="group" aria-label="Conversation actions">
                  <button
                    className="action-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle delete conversation
                      const updatedHistory = history.filter(
                        (item) => item.id !== h.id,
                      );
                      setHistory(updatedHistory);
                      localStorage.setItem(
                        "conversations",
                        JSON.stringify(updatedHistory),
                      );
                    }}
                    title="Delete conversation"
                    aria-label={`Delete conversation: ${h.title || "Untitled conversation"}`}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
