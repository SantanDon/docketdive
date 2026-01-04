"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type {
  Case,
  CaseStatus,
  CaseType,
  CaseDeadline,
  CaseNote,
  CaseStats,
} from "@/types/legal-tools";
import {
  createCase,
  getCase,
  getAllCases,
  updateCase,
  deleteCase,
  searchCases,
} from "@/lib/db";
import { calculateCaseAge, isDeadlineApproaching } from "@/types/legal-tools";

// ============================================
// Types
// ============================================

interface CaseContextType {
  // State
  cases: Case[];
  selectedCase: Case | null;
  loading: boolean;
  error: string | null;
  stats: CaseStats;
  filter: CaseStatus | "all";
  searchQuery: string;

  // Case CRUD
  addCase: (caseData: Omit<Case, "id" | "createdAt" | "updatedAt">) => Promise<string | null>;
  getById: (id: string) => Promise<Case | undefined>;
  updateCase: (id: string, updates: Partial<Case>) => Promise<boolean>;
  removeCase: (id: string) => Promise<boolean>;
  selectCase: (caseItem: Case | null) => void;

  // Deadline management
  addDeadline: (caseId: string, deadline: Omit<CaseDeadline, "id">) => Promise<boolean>;
  updateDeadline: (caseId: string, deadlineId: string, updates: Partial<CaseDeadline>) => Promise<boolean>;
  removeDeadline: (caseId: string, deadlineId: string) => Promise<boolean>;
  toggleDeadlineComplete: (caseId: string, deadlineId: string) => Promise<boolean>;

  // Note management
  addNote: (caseId: string, content: string) => Promise<boolean>;
  updateNote: (caseId: string, noteId: string, content: string) => Promise<boolean>;
  removeNote: (caseId: string, noteId: string) => Promise<boolean>;

  // Filtering and search
  setFilter: (status: CaseStatus | "all") => void;
  setSearchQuery: (query: string) => void;
  searchCases: (query: string) => Promise<void>;

  // Helpers
  refresh: () => Promise<void>;
  getUpcomingDeadlines: (days?: number) => (CaseDeadline & { caseTitle: string; caseId: string })[];
  getCaseAge: (caseItem: Case) => number;
  isDeadlineApproaching: (deadline: CaseDeadline, days?: number) => boolean;
}

// ============================================
// Context
// ============================================

const CaseContext = createContext<CaseContextType | undefined>(undefined);

// ============================================
// Provider
// ============================================

export function CaseProvider({ children }: { children: ReactNode }) {
  const [cases, setCases] = useState<Case[]>([]);
  const [allCases, setAllCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<CaseStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Calculate stats
  const stats: CaseStats = {
    total: allCases.length,
    active: allCases.filter((c) => c.status === "active").length,
    pending: allCases.filter((c) => c.status === "pending").length,
    closed: allCases.filter((c) => c.status === "closed").length,
    onHold: allCases.filter((c) => c.status === "on_hold").length,
    upcomingDeadlines: allCases.reduce((count, c) => {
      return count + c.deadlines.filter((d) => isDeadlineApproaching(d, 7)).length;
    }, 0),
  };

  // Load cases
  const loadCases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedCases = await getAllCases();
      // Sort by updatedAt descending
      loadedCases.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setAllCases(loadedCases);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cases");
      console.error("Failed to load cases:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Apply filter when allCases or filter changes
  useEffect(() => {
    let filtered = allCases;
    
    if (filter !== "all") {
      filtered = filtered.filter((c) => c.status === filter);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.clientName.toLowerCase().includes(query) ||
          c.caseNumber?.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query)
      );
    }
    
    setCases(filtered);
  }, [allCases, filter, searchQuery]);

  // Load on mount
  useEffect(() => {
    loadCases();
  }, [loadCases]);

  // Add case
  const addCaseHandler = useCallback(
    async (caseData: Omit<Case, "id" | "createdAt" | "updatedAt">): Promise<string | null> => {
      try {
        setError(null);
        const id = await createCase(caseData);
        await loadCases();
        return id;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create case");
        return null;
      }
    },
    [loadCases]
  );

  // Get by ID
  const getById = useCallback(async (id: string): Promise<Case | undefined> => {
    try {
      return await getCase(id);
    } catch (err) {
      console.error("Failed to get case:", err);
      return undefined;
    }
  }, []);

  // Update case
  const updateCaseHandler = useCallback(
    async (id: string, updates: Partial<Case>): Promise<boolean> => {
      try {
        setError(null);
        await updateCase(id, updates);
        await loadCases();
        
        // Update selected case if it's the one being updated
        if (selectedCase?.id === id) {
          const updated = await getCase(id);
          if (updated) setSelectedCase(updated);
        }
        
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update case");
        return false;
      }
    },
    [loadCases, selectedCase]
  );

  // Remove case
  const removeCase = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setError(null);
        await deleteCase(id);
        await loadCases();
        
        if (selectedCase?.id === id) {
          setSelectedCase(null);
        }
        
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete case");
        return false;
      }
    },
    [loadCases, selectedCase]
  );

  // Select case
  const selectCase = useCallback((caseItem: Case | null) => {
    setSelectedCase(caseItem);
  }, []);

  // Add deadline
  const addDeadline = useCallback(
    async (caseId: string, deadline: Omit<CaseDeadline, "id">): Promise<boolean> => {
      try {
        const caseItem = await getCase(caseId);
        if (!caseItem) return false;

        const newDeadline: CaseDeadline = {
          ...deadline,
          id: `deadline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };

        await updateCase(caseId, {
          deadlines: [...caseItem.deadlines, newDeadline],
        });
        await loadCases();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add deadline");
        return false;
      }
    },
    [loadCases]
  );

  // Update deadline
  const updateDeadlineHandler = useCallback(
    async (caseId: string, deadlineId: string, updates: Partial<CaseDeadline>): Promise<boolean> => {
      try {
        const caseItem = await getCase(caseId);
        if (!caseItem) return false;

        const updatedDeadlines = caseItem.deadlines.map((d) =>
          d.id === deadlineId ? { ...d, ...updates } : d
        );

        await updateCase(caseId, { deadlines: updatedDeadlines });
        await loadCases();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update deadline");
        return false;
      }
    },
    [loadCases]
  );

  // Remove deadline
  const removeDeadline = useCallback(
    async (caseId: string, deadlineId: string): Promise<boolean> => {
      try {
        const caseItem = await getCase(caseId);
        if (!caseItem) return false;

        await updateCase(caseId, {
          deadlines: caseItem.deadlines.filter((d) => d.id !== deadlineId),
        });
        await loadCases();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to remove deadline");
        return false;
      }
    },
    [loadCases]
  );

  // Toggle deadline complete
  const toggleDeadlineComplete = useCallback(
    async (caseId: string, deadlineId: string): Promise<boolean> => {
      try {
        const caseItem = await getCase(caseId);
        if (!caseItem) return false;

        const updatedDeadlines = caseItem.deadlines.map((d) =>
          d.id === deadlineId ? { ...d, completed: !d.completed } : d
        );

        await updateCase(caseId, { deadlines: updatedDeadlines });
        await loadCases();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to toggle deadline");
        return false;
      }
    },
    [loadCases]
  );

  // Add note
  const addNote = useCallback(
    async (caseId: string, content: string): Promise<boolean> => {
      try {
        const caseItem = await getCase(caseId);
        if (!caseItem) return false;

        const newNote: CaseNote = {
          id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          content,
          createdAt: new Date().toISOString(),
        };

        await updateCase(caseId, {
          notes: [...caseItem.notes, newNote],
        });
        await loadCases();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add note");
        return false;
      }
    },
    [loadCases]
  );

  // Update note
  const updateNoteHandler = useCallback(
    async (caseId: string, noteId: string, content: string): Promise<boolean> => {
      try {
        const caseItem = await getCase(caseId);
        if (!caseItem) return false;

        const updatedNotes = caseItem.notes.map((n) =>
          n.id === noteId ? { ...n, content, updatedAt: new Date().toISOString() } : n
        );

        await updateCase(caseId, { notes: updatedNotes });
        await loadCases();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update note");
        return false;
      }
    },
    [loadCases]
  );

  // Remove note
  const removeNote = useCallback(
    async (caseId: string, noteId: string): Promise<boolean> => {
      try {
        const caseItem = await getCase(caseId);
        if (!caseItem) return false;

        await updateCase(caseId, {
          notes: caseItem.notes.filter((n) => n.id !== noteId),
        });
        await loadCases();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to remove note");
        return false;
      }
    },
    [loadCases]
  );

  // Search
  const searchCasesHandler = useCallback(async (query: string): Promise<void> => {
    setSearchQuery(query);
  }, []);

  // Get upcoming deadlines
  const getUpcomingDeadlines = useCallback(
    (days: number = 7): (CaseDeadline & { caseTitle: string; caseId: string })[] => {
      const deadlines: (CaseDeadline & { caseTitle: string; caseId: string })[] = [];

      allCases.forEach((c) => {
        c.deadlines.forEach((d) => {
          if (isDeadlineApproaching(d, days)) {
            deadlines.push({ ...d, caseTitle: c.title, caseId: c.id });
          }
        });
      });

      return deadlines.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    },
    [allCases]
  );

  // Get case age
  const getCaseAge = useCallback((caseItem: Case): number => {
    return calculateCaseAge(caseItem.createdAt);
  }, []);

  return (
    <CaseContext.Provider
      value={{
        cases,
        selectedCase,
        loading,
        error,
        stats,
        filter,
        searchQuery,
        addCase: addCaseHandler,
        getById,
        updateCase: updateCaseHandler,
        removeCase,
        selectCase,
        addDeadline,
        updateDeadline: updateDeadlineHandler,
        removeDeadline,
        toggleDeadlineComplete,
        addNote,
        updateNote: updateNoteHandler,
        removeNote,
        setFilter,
        setSearchQuery,
        searchCases: searchCasesHandler,
        refresh: loadCases,
        getUpcomingDeadlines,
        getCaseAge,
        isDeadlineApproaching,
      }}
    >
      {children}
    </CaseContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useCaseContext() {
  const context = useContext(CaseContext);
  if (context === undefined) {
    throw new Error("useCaseContext must be used within a CaseProvider");
  }
  return context;
}

export default CaseContext;
