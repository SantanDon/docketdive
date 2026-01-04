"use client";

import { useState, useEffect, useCallback } from "react";
import type { Case, CaseStatus, CaseType, CaseDeadline, CaseStats } from "@/types/legal-tools";
import {
  createCase,
  getCase,
  getAllCases,
  getCasesByStatus,
  updateCase,
  deleteCase,
  searchCases,
} from "@/lib/db";
import { calculateCaseAge, isDeadlineApproaching } from "@/types/legal-tools";

export interface UseCasesReturn {
  cases: Case[];
  loading: boolean;
  error: string | null;
  stats: CaseStats;
  // CRUD operations
  addCase: (caseData: Omit<Case, "id" | "createdAt" | "updatedAt">) => Promise<string | null>;
  getById: (id: string) => Promise<Case | undefined>;
  update: (id: string, updates: Partial<Case>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  // Filtering and search
  filterByStatus: (status: CaseStatus | "all") => void;
  search: (query: string) => Promise<void>;
  // Refresh
  refresh: () => Promise<void>;
  // Deadline helpers
  getUpcomingDeadlines: (days?: number) => CaseDeadline[];
  getCaseAge: (caseItem: Case) => number;
}

export function useCases(): UseCasesReturn {
  const [cases, setCases] = useState<Case[]>([]);
  const [allCases, setAllCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<CaseStatus | "all">("all");

  // Calculate stats from all cases
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

  // Load all cases on mount
  const loadCases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedCases = await getAllCases();
      setAllCases(loadedCases);
      
      // Apply current filter
      if (currentFilter === "all") {
        setCases(loadedCases);
      } else {
        setCases(loadedCases.filter((c) => c.status === currentFilter));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cases");
      console.error("Failed to load cases:", err);
    } finally {
      setLoading(false);
    }
  }, [currentFilter]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  // Add a new case
  const addCase = useCallback(
    async (caseData: Omit<Case, "id" | "createdAt" | "updatedAt">): Promise<string | null> => {
      try {
        setError(null);
        const id = await createCase(caseData);
        await loadCases(); // Refresh the list
        return id;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create case");
        console.error("Failed to create case:", err);
        return null;
      }
    },
    [loadCases]
  );

  // Get case by ID
  const getById = useCallback(async (id: string): Promise<Case | undefined> => {
    try {
      return await getCase(id);
    } catch (err) {
      console.error("Failed to get case:", err);
      return undefined;
    }
  }, []);

  // Update a case
  const update = useCallback(
    async (id: string, updates: Partial<Case>): Promise<boolean> => {
      try {
        setError(null);
        await updateCase(id, updates);
        await loadCases(); // Refresh the list
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update case");
        console.error("Failed to update case:", err);
        return false;
      }
    },
    [loadCases]
  );

  // Delete a case
  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setError(null);
        await deleteCase(id);
        await loadCases(); // Refresh the list
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete case");
        console.error("Failed to delete case:", err);
        return false;
      }
    },
    [loadCases]
  );

  // Filter by status
  const filterByStatus = useCallback(
    (status: CaseStatus | "all") => {
      setCurrentFilter(status);
      if (status === "all") {
        setCases(allCases);
      } else {
        setCases(allCases.filter((c) => c.status === status));
      }
    },
    [allCases]
  );

  // Search cases
  const search = useCallback(async (query: string): Promise<void> => {
    try {
      setLoading(true);
      if (!query.trim()) {
        await loadCases();
        return;
      }
      const results = await searchCases(query);
      setCases(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  }, [loadCases]);

  // Get upcoming deadlines across all cases
  const getUpcomingDeadlines = useCallback(
    (days: number = 7): CaseDeadline[] => {
      const deadlines: (CaseDeadline & { caseName: string })[] = [];
      
      allCases.forEach((c) => {
        c.deadlines.forEach((d) => {
          if (isDeadlineApproaching(d, days)) {
            deadlines.push({ ...d, caseName: c.title });
          }
        });
      });

      // Sort by date
      return deadlines.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    },
    [allCases]
  );

  // Get case age helper
  const getCaseAge = useCallback((caseItem: Case): number => {
    return calculateCaseAge(caseItem.createdAt);
  }, []);

  return {
    cases,
    loading,
    error,
    stats,
    addCase,
    getById,
    update,
    remove,
    filterByStatus,
    search,
    refresh: loadCases,
    getUpcomingDeadlines,
    getCaseAge,
  };
}

export default useCases;
