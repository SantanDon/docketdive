'use client';

import React, { createContext, useContext, useState, type ReactNode, type Dispatch, type SetStateAction, useCallback, useRef, useEffect } from 'react';
import type { Message, ELILevel, Mode, Conversation, PendingAttachment } from '../types';

import { useRouter } from 'next/navigation';

// Generate a unique anonymous user ID for privacy isolation
function getOrCreateAnonymousUserId(): string {
  if (typeof window === 'undefined') return 'server_render';
  
  const storageKey = 'docketdive_anonymous_user_id';
  let userId = localStorage.getItem(storageKey);
  
  if (!userId) {
    // Generate a cryptographically random ID
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    userId = 'anon_' + Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(storageKey, userId);
  }
  
  return userId;
}

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
  streamingStatus: string;
  sendMessage: (messageOverride?: string) => Promise<void>;
  stopGeneration: () => void;
  newChat: () => void;
  handleLogin: () => void;
  deleteConversation: (id: string) => void;
  loadConversation: (id: string) => void;
  language: string;
  setLanguage: Dispatch<SetStateAction<string>>;
  legalAidMode: boolean;
  setLegalAidMode: Dispatch<SetStateAction<boolean>>;
  pendingAttachment: PendingAttachment | null;
  setPendingAttachment: Dispatch<SetStateAction<PendingAttachment | null>>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mode, setMode] = useState<Mode>('normal');
  const [eliLevel, setEliLevel] = useState<ELILevel>('ELI15');
  const [showLogin, setShowLogin] = useState(false);
  const [provider, setProvider] = useState<"ollama" | "groq">("groq");
  const [streamingStatus, setStreamingStatus] = useState("");
  const [language, setLanguage] = useState<string>("en");
  const [legalAidMode, setLegalAidMode] = useState<boolean>(false);
  const [anonymousUserId, setAnonymousUserId] = useState<string>('');
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null);

  // Initialize anonymous user ID on mount (client-side only)
  useEffect(() => {
    setAnonymousUserId(getOrCreateAnonymousUserId());
  }, []);

  // Load language preference from localStorage on mount
  React.useEffect(() => {
    const savedLang = localStorage.getItem("docketdive_language");
    if (savedLang) setLanguage(savedLang);
    
    const savedLegalAid = localStorage.getItem("docketdive_legal_aid");
    if (savedLegalAid) setLegalAidMode(savedLegalAid === "true");

    // Listen for language changes from LanguageSelector
    const handleLangChange = (e: CustomEvent) => {
      setLanguage(e.detail.code);
    };
    window.addEventListener("languageChange", handleLangChange as EventListener);
    
    // Listen for legal aid mode changes
    const handleLegalAidChange = (e: CustomEvent) => {
      setLegalAidMode(e.detail.enabled);
    };
    window.addEventListener("legalAidModeChange", handleLegalAidChange as EventListener);

    return () => {
      window.removeEventListener("languageChange", handleLangChange as EventListener);
      window.removeEventListener("legalAidModeChange", handleLegalAidChange as EventListener);
    };
  }, []);

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
    let rawMessage = (messageOverride ?? inputMessage).trim();
    
    // Initial check - if no message and no attachment, return
    if ((!rawMessage && !pendingAttachment) || isLoading) return;
    
    // If there's an attachment, prepend it to the message
    if (pendingAttachment) {
      const attachmentContext = `\n\n[ATTACHED DOCUMENT]\nFilename: ${pendingAttachment.metadata.fileName}\nContent:\n${pendingAttachment.content}\n[END ATTACHED DOCUMENT]\n\n`;
      rawMessage = attachmentContext + (rawMessage || "Analyze this document.");
    }

    if (!rawMessage) return;

    // Check for glossary intent
    if (rawMessage.toLowerCase().includes("legal tools") || rawMessage.toLowerCase().includes("show tools")) {
      console.log('Redirecting to tools page');
      router.push("/tools");
      return;
    }

    console.log('Sending message to API...', { provider, messageLength: rawMessage.length });

    // Create new AbortController
    abortControllerRef.current = new AbortController();

    const userMessage = {
      id: String(Date.now()),
      content: rawMessage,
      role: "user" as const,
      timestamp: new Date().toISOString(),
      status: "sending" as const,
    } as Message;

    // Optimistic update
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputMessage("");
    setPendingAttachment(null); // Clear attachment after sending
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

       const controller = abortControllerRef.current!;
       
       // Add request timeout (3 minutes for initial connection)
       const timeoutId = setTimeout(() => {
         controller.abort();
       }, 180000);

        let res: Response;
        try {
          console.log('Fetching /api/chat...');
          // Get privacy mode from localStorage
          const privacyMode = localStorage.getItem('docketdive_privacy_mode') === 'true';
          res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              message: enhancedMessage, 
              provider,
              // Use the optimistic-updated messages so the API sees the latest user prompt.
              conversationHistory: newMessages,
              conversationId,
              userId: anonymousUserId || getOrCreateAnonymousUserId(),
              language,
              legalAidMode,
              privacyMode  // Pass client-side privacy preference
            }),
            signal: controller.signal,
          });
       } finally {
         clearTimeout(timeoutId);
       }

       console.log('Response received', { status: res.status, ok: res.ok });

       if (!res.ok) {
         const errorText = await res.text();
         console.error('API Error Response:', errorText);
         throw new Error(`Server error ${res.status}: ${errorText || res.statusText}`);
       }
       if (!res.body) throw new Error("No response body from server");

       console.log('Starting stream read...');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let fullContent = "";
      let sources: any[] = [];
      setStreamingStatus("");

      // Add temporary assistant message for streaming
      const assistantMessageId = String(Date.now() + 1);
      setMessages(prev => [
        ...prev,
        {
          id: assistantMessageId,
          content: "",
          role: "assistant",
          timestamp: new Date().toISOString(),
          status: "sending",
          sources: []
        }
      ]);

      // Robust NDJSON parsing: JSON objects can be split across network chunks.
      // We must buffer partial lines.
      let pending = "";
      let lastChunkTime = Date.now();
      let hasReceivedContent = false;
      
      // Stream timeout: if no data for 60 seconds, abort
      const streamTimeoutId = setInterval(() => {
        const timeSinceLastChunk = Date.now() - lastChunkTime;
        if (timeSinceLastChunk > 60000 && !done) {
          console.error('[Chat] Stream timeout: no data for 60 seconds');
          reader.cancel();
          done = true;
          clearInterval(streamTimeoutId);
        }
      }, 10000);

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;

        const chunk = decoder.decode(value || new Uint8Array(), { stream: !done });
        if (chunk.length > 0) {
          if (!hasReceivedContent) console.log('First chunk received', chunk.substring(0, 50));
          lastChunkTime = Date.now();
          hasReceivedContent = true;
        }
        pending += chunk;

        // Process complete lines; keep the last partial line in `pending`.
        const parts = pending.split("\n");
        pending = parts.pop() ?? "";

        for (const rawLine of parts) {
          const line = rawLine.trim();
          if (!line) continue;

          let parsed: any;
          try {
            parsed = JSON.parse(line);
          } catch (e) {
            // If we fail parsing a line, it might be because we split mid-JSON.
            // Re-attach it to pending and wait for more data.
            pending = line + "\n" + pending;
            continue;
          }

          if (parsed.type === "text_delta") {
            setStreamingStatus(""); // Clear status once text starts
            fullContent += parsed.content;
            setMessages(prev => prev.map(m => 
              m.id === assistantMessageId ? { ...m, content: fullContent } : m
            ));
          } else if (parsed.type === "sources") {
            sources = parsed.content;
            setMessages(prev => prev.map(m => 
              m.id === assistantMessageId ? { ...m, sources } : m
            ));
          } else if (parsed.type === "status") {
            // Allow empty status to clear UI.
            setStreamingStatus(parsed.content || "");
          } else if (parsed.type === "error") {
            console.error("API Error:", parsed.content);
            // Don't throw - just add to fullContent so user sees the error
            fullContent += `\n\n❌ **Error**: ${parsed.content}`;
            setMessages(prev => prev.map(m => 
              m.id === assistantMessageId ? { ...m, content: fullContent } : m
            ));
          } else if (parsed.type === "metadata") {
            console.log("Metadata:", parsed.content);
          }
        }
      }
      
      clearInterval(streamTimeoutId);
      
      // Check if stream was empty
      if (!hasReceivedContent) {
        console.warn('[Chat] Stream completed but no data received');
        fullContent = '⚠️ No response received from server. The request may have timed out. Please try again.';
      }

      // Try parse any final pending line.
      const tail = pending.trim();
      if (tail) {
        try {
          const parsed = JSON.parse(tail);
          if (parsed.type === "text_delta") {
            fullContent += parsed.content;
            setMessages(prev => prev.map(m => 
              m.id === assistantMessageId ? { ...m, content: fullContent } : m
            ));
          } else if (parsed.type === "sources") {
            sources = parsed.content;
            setMessages(prev => prev.map(m => 
              m.id === assistantMessageId ? { ...m, sources } : m
            ));
          } else if (parsed.type === "status") {
            setStreamingStatus(parsed.content || "");
          } else if (parsed.type === "error") {
            console.error("API Error (tail):", parsed.content);
            fullContent += `\n\n❌ **Error**: ${parsed.content}`;
            setMessages(prev => prev.map(m => 
              m.id === assistantMessageId ? { ...m, content: fullContent } : m
            ));
          }
        } catch {
          // ignore JSON parsing errors
        }
      }

      // Final update to mark as sent and format
      setMessages(prev => prev.map(m => {
        if (m.id === assistantMessageId) {
          let formattedContent = fullContent;
          if (mode === "student") {
            const levelText = eliLevel === "ELI5" ? "ELI5 level" : eliLevel === "ELI15" ? "ELI15 level" : "ELI25 level";
            formattedContent = `🎓 **Student Mode (${levelText}):**\n\n${fullContent}`;
          }
          return { ...m, content: formattedContent, status: "sent" };
        }
        return m;
      }));

      // Save to localStorage
      setMessages(current => {
        localStorage.setItem("current_messages", JSON.stringify(current));
        return current;
      });

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Generation stopped by user');
        return;
      }
      
      console.error('Chat error:', err);
      
      const errMsg: Message = {
        id: String(Date.now() + 2),
        content: `⚠️ Error: ${err.message || "I encountered an error processing your legal query. Please try again."}`,
        role: "assistant",
        timestamp: new Date().toISOString(),
        status: "sent",
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
      setStreamingStatus("");
      abortControllerRef.current = null;
    }
  }, [inputMessage, isLoading, mode, eliLevel, messages, provider, language, legalAidMode, anonymousUserId, pendingAttachment]);

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
      setProvider,
      streamingStatus,
      language,
      setLanguage,
      legalAidMode,
      setLegalAidMode,
      pendingAttachment,
      setPendingAttachment
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
