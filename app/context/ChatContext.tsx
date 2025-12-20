'use client';

import React, { createContext, useContext, useState, type ReactNode, type Dispatch, type SetStateAction, useCallback, useRef } from 'react';
import type { Message, ELILevel, Mode, Conversation } from '../types';

interface ChatContextType {
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
  conversations: Conversation[];
  setConversations: Dispatch<SetStateAction<Conversation[]>>;
  inputMessage: string;
  setInputMessage: Dispatch<SetStateAction<string>>;
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  sidebarOpen: boolean;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
  mode: Mode;
  setMode: Dispatch<SetStateAction<Mode>>;
  eliLevel: ELILevel;
  setEliLevel: Dispatch<SetStateAction<ELILevel>>;
  showLogin: boolean;
  setShowLogin: Dispatch<SetStateAction<boolean>>;
  toggleStudentMode: () => void;
  provider: "ollama" | "groq";
  setProvider: Dispatch<SetStateAction<"ollama" | "groq">>;
  sendMessage: (messageOverride?: string) => Promise<void>;
  stopGeneration: () => void;
  newChat: () => void;
  handleLogin: () => void;
  deleteConversation: (id: string) => void;
  loadConversation: (id: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mode, setMode] = useState<Mode>('normal');
  const [eliLevel, setEliLevel] = useState<ELILevel>('ELI15');
  const [showLogin, setShowLogin] = useState(false);
  const [provider, setProvider] = useState<"ollama" | "groq">("ollama");

  const toggleStudentMode = useCallback(() => {
    setMode((m) => (m === "student" ? "normal" : "student"));
  }, []);

  // Load conversation from localStorage
  const loadConversation = useCallback((id: string) => {
    try {
      const allMessages = JSON.parse(localStorage.getItem("all_messages") ?? "{}");
      const conversationMessages = allMessages[id];
      if (conversationMessages) {
        setMessages(conversationMessages);
        // Also update current_messages for persistence
        localStorage.setItem("current_messages", JSON.stringify(conversationMessages));
      }
    } catch (err) {
      console.error("Failed to load conversation", err);
    }
  }, []);

  // Delete conversation
  const deleteConversation = useCallback((id: string) => {
    const updated = conversations.filter(c => c.id !== id);
    setConversations(updated);
    localStorage.setItem("conversations", JSON.stringify(updated));

    // Also remove messages
    try {
      const allMessages = JSON.parse(localStorage.getItem("all_messages") ?? "{}");
      delete allMessages[id];
      localStorage.setItem("all_messages", JSON.stringify(allMessages));
    } catch (err) {
      console.error("Failed to delete conversation data", err);
    }
  }, [conversations]);

  const abortControllerRef = useRef<AbortController | null>(null);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      
      // Optional: Add a message indicating generation was stopped
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === 'assistant' && lastMsg.status === 'sending') {
          return [
            ...prev.slice(0, -1),
            { ...lastMsg, content: lastMsg.content + " [Generation stopped by user]", status: 'sent' }
          ];
        }
        return prev;
      });
    }
  }, []);

  const sendMessage = useCallback(async (messageOverride?: string) => {
    const rawMessage = (messageOverride ?? inputMessage).trim();
    if (!rawMessage || isLoading) return;

    // Create new AbortController
    abortControllerRef.current = new AbortController();

    const userMessage: Message = {
      id: String(Date.now()),
      content: rawMessage,
      role: "user",
      timestamp: new Date().toISOString(),
      status: "sending",
    };

    // Optimistic update
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputMessage("");
    setIsLoading(true);

    // enhance when in student mode
    let enhancedMessage = rawMessage;
    if (mode === "student") {
      const instr =
        eliLevel === "ELI5"
          ? "Explain this in very simple terms for a 5-year-old, using easy examples and simple words."
          : eliLevel === "ELI15"
            ? "Explain this clearly for a teenager, with relatable examples and slightly more detail."
            : "Explain this for a young adult, with detailed examples and proper legal terminology.";
      enhancedMessage = `${instr} ${rawMessage}`;
    }

    try {
      // Get or create conversation ID
      const conversationId = localStorage.getItem("current_conversation_id") || `conv_${Date.now()}`;
      localStorage.setItem("current_conversation_id", conversationId);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: enhancedMessage, 
          provider,
          conversationHistory: messages,
          conversationId,
          userId: "default_user"
        }),
        signal: abortControllerRef.current.signal,
      });

      const data = await res.json();

      // mark user's message as sent
      const messagesWithSentStatus = newMessages.map((m) =>
        m.id === userMessage.id ? { ...m, status: "sent" as const } : m
      );

      setMessages(messagesWithSentStatus);

      // Format the response with better legal structure
      let formattedResponse = data?.response ?? "Sorry, something went wrong.";

      // Add legal-specific formatting if in student mode
      if (mode === "student") {
        const levelText = 
          eliLevel === "ELI5" ? "ELI5 level" :
          eliLevel === "ELI15" ? "ELI15 level" : "ELI25 level";
        
        formattedResponse = `🎓 **Student Mode (${levelText}):**\n\n${data?.response}`;
      }

      const assistantMessage: Message = {
        id: String(Date.now() + 1),
        content: formattedResponse,
        role: "assistant",
        timestamp: new Date().toISOString(),
        status: "sent",
        sources: data?.sources ?? [],
      };

      const finalMessages = [...messagesWithSentStatus, assistantMessage];
      setMessages(finalMessages);

      // Save to current_messages
      localStorage.setItem("current_messages", JSON.stringify(finalMessages));

      // Show memory metadata in console (optional)
      if (data?.metadata?.memoryUsed) {
        console.log("?? Memory Context:", data.metadata.memoryUsed);
      }

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Generation stopped by user');
        return;
      }
      
      // on error, append an assistant error message
      const errMsg: Message = {
        id: String(Date.now() + 2),
        content: "⚠️ I apologize, but I encountered an error processing your legal query. Please try again or rephrase your question.",
        role: "assistant",
        timestamp: new Date().toISOString(),
        status: "sent",
      };
      setMessages((prev) => [...prev, errMsg]);
      console.error(err);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [inputMessage, isLoading, mode, eliLevel, messages, provider]);

  const newChat = useCallback(() => {
    // Save current conversation before clearing
    if (messages.length > 0) {
      const id = String(Date.now());
      const title = messages[0]?.content?.substring(0, 40) || "New conversation";
      const date = new Date().toISOString();

      const newConv: Conversation = {
        id,
        title,
        date,
        messages,
      };

      const updatedConversations = [newConv, ...conversations].slice(0, 50);
      setConversations(updatedConversations);
      localStorage.setItem("conversations", JSON.stringify(updatedConversations));

      // Save messages map
      try {
        const allMessages = JSON.parse(localStorage.getItem("all_messages") ?? "{}");
        allMessages[id] = messages;
        localStorage.setItem("all_messages", JSON.stringify(allMessages));
      } catch (e) {
        console.error("Failed to save messages", e);
      }
    }

    setMessages([]);
    localStorage.removeItem("current_messages");
    localStorage.removeItem("current_conversation_id");
  }, [messages, conversations]);

  const handleLogin = useCallback(() => {
    setShowLogin(false);
  }, []);

  return (
    <ChatContext.Provider value={{
      messages,
      setMessages,
      conversations,
      setConversations,
      inputMessage,
      setInputMessage,
      isLoading,
      setIsLoading,
      sidebarOpen,
      setSidebarOpen,
      mode,
      setMode,
      eliLevel,
      setEliLevel,
      showLogin,
      setShowLogin,
      toggleStudentMode,
      sendMessage,
      stopGeneration,
      newChat,
      handleLogin,
      deleteConversation,
      loadConversation,
      provider,
      setProvider
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
