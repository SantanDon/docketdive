// lib/db.ts
// IndexedDB database setup using Dexie.js for local storage of cases, tasks, and documents

import Dexie, { type Table } from 'dexie';
import type { Case, Task, Client, DocumentRef } from '@/types/legal-tools';

// Extended types for database storage
export interface StoredDocument extends DocumentRef {
  caseId?: string;
  content?: string; // For text-based documents
  blob?: Blob; // For binary documents
}

// Database class extending Dexie
export class DocketDiveDB extends Dexie {
  cases!: Table<Case>;
  tasks!: Table<Task>;
  documents!: Table<StoredDocument>;
  clients!: Table<Client>;

  constructor() {
    super('DocketDiveDB');
    
    // Define database schema
    // Indexed fields are listed after the primary key (++)
    this.version(1).stores({
      cases: '++id, status, clientName, caseType, createdAt, updatedAt',
      tasks: '++id, caseId, status, priority, dueDate, createdAt',
      documents: '++id, caseId, type, uploadedAt',
      clients: '++id, name, email, phone, createdAt'
    });
  }
}

// Singleton database instance
export const db = new DocketDiveDB();

// ============================================
// Case Operations
// ============================================

export async function createCase(caseData: Omit<Case, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = new Date().toISOString();
  const id = await db.cases.add({
    ...caseData,
    id: `case_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    updatedAt: now,
    deadlines: caseData.deadlines || [],
    documents: caseData.documents || [],
    notes: caseData.notes || [],
  } as Case);
  return String(id);
}

export async function getCase(id: string): Promise<Case | undefined> {
  return db.cases.get(id);
}

export async function getAllCases(): Promise<Case[]> {
  return db.cases.toArray();
}

export async function getCasesByStatus(status: Case['status']): Promise<Case[]> {
  return db.cases.where('status').equals(status).toArray();
}

export async function updateCase(id: string, updates: Partial<Case>): Promise<void> {
  await db.cases.update(id, {
    ...updates,
    updatedAt: new Date().toISOString()
  });
}

export async function deleteCase(id: string): Promise<void> {
  // Also delete associated tasks
  await db.tasks.where('caseId').equals(id).delete();
  await db.cases.delete(id);
}

export async function searchCases(query: string): Promise<Case[]> {
  const lowerQuery = query.toLowerCase();
  return db.cases
    .filter(c => 
      c.title.toLowerCase().includes(lowerQuery) ||
      c.clientName.toLowerCase().includes(lowerQuery) ||
      (c.caseNumber?.toLowerCase().includes(lowerQuery) ?? false) ||
      (c.description?.toLowerCase().includes(lowerQuery) ?? false)
    )
    .toArray();
}

// ============================================
// Task Operations
// ============================================

export async function createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = new Date().toISOString();
  const id = await db.tasks.add({
    ...taskData,
    id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    priority: taskData.priority || 'medium', // Default priority
    status: taskData.status || 'todo',
    createdAt: now,
    updatedAt: now,
  } as Task);
  return String(id);
}

export async function getTask(id: string): Promise<Task | undefined> {
  return db.tasks.get(id);
}

export async function getAllTasks(): Promise<Task[]> {
  return db.tasks.toArray();
}

export async function getTasksByCase(caseId: string): Promise<Task[]> {
  return db.tasks.where('caseId').equals(caseId).toArray();
}

export async function getTasksByStatus(status: Task['status']): Promise<Task[]> {
  return db.tasks.where('status').equals(status).toArray();
}

export async function getOverdueTasks(): Promise<Task[]> {
  const now = new Date().toISOString();
  return db.tasks
    .filter(t => t.status !== 'completed' && !!t.dueDate && t.dueDate < now)
    .toArray();
}

export async function getTasksDueToday(): Promise<Task[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return db.tasks
    .filter(t => {
      if (!t.dueDate || t.status === 'completed') return false;
      const dueDate = new Date(t.dueDate);
      return dueDate >= today && dueDate < tomorrow;
    })
    .toArray();
}

export async function getTasksDueThisWeek(): Promise<Task[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  return db.tasks
    .filter(t => {
      if (!t.dueDate || t.status === 'completed') return false;
      const dueDate = new Date(t.dueDate);
      return dueDate >= today && dueDate < nextWeek;
    })
    .toArray();
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<void> {
  const updateData: Partial<Task> = {
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  // If marking as completed, set completedAt
  if (updates.status === 'completed') {
    updateData.completedAt = new Date().toISOString();
  }
  
  await db.tasks.update(id, updateData);
}

export async function deleteTask(id: string): Promise<void> {
  await db.tasks.delete(id);
}

export async function getTaskStats(): Promise<{
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
}> {
  const allTasks = await getAllTasks();
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  return {
    total: allTasks.length,
    completed: allTasks.filter(t => t.status === 'completed').length,
    inProgress: allTasks.filter(t => t.status === 'in_progress').length,
    todo: allTasks.filter(t => t.status === 'todo').length,
    overdue: allTasks.filter(t => 
      t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < now
    ).length,
    dueToday: allTasks.filter(t => {
      if (!t.dueDate || t.status === 'completed') return false;
      const dueDate = new Date(t.dueDate);
      return dueDate >= today && dueDate < tomorrow;
    }).length,
    dueThisWeek: allTasks.filter(t => {
      if (!t.dueDate || t.status === 'completed') return false;
      const dueDate = new Date(t.dueDate);
      return dueDate >= today && dueDate < nextWeek;
    }).length,
  };
}

// ============================================
// Client Operations
// ============================================

export async function createClient(clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = new Date().toISOString();
  const id = await db.clients.add({
    ...clientData,
    id: `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    updatedAt: now,
  } as Client);
  return String(id);
}

export async function getClient(id: string): Promise<Client | undefined> {
  return db.clients.get(id);
}

export async function getAllClients(): Promise<Client[]> {
  return db.clients.toArray();
}

export async function searchClients(query: string): Promise<Client[]> {
  const lowerQuery = query.toLowerCase();
  return db.clients
    .filter(c => 
      c.name.toLowerCase().includes(lowerQuery) ||
      (c.email?.toLowerCase().includes(lowerQuery) ?? false) ||
      (c.phone?.includes(query) ?? false)
    )
    .toArray();
}

export async function updateClient(id: string, updates: Partial<Client>): Promise<void> {
  await db.clients.update(id, {
    ...updates,
    updatedAt: new Date().toISOString()
  });
}

export async function deleteClient(id: string): Promise<void> {
  await db.clients.delete(id);
}

// ============================================
// Document Operations
// ============================================

export async function storeDocument(doc: Omit<StoredDocument, 'id'>): Promise<string> {
  const id = await db.documents.add({
    ...doc,
    id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  } as StoredDocument);
  return String(id);
}

export async function getDocument(id: string): Promise<StoredDocument | undefined> {
  return db.documents.get(id);
}

export async function getDocumentsByCase(caseId: string): Promise<StoredDocument[]> {
  return db.documents.where('caseId').equals(caseId).toArray();
}

export async function deleteDocument(id: string): Promise<void> {
  await db.documents.delete(id);
}

// ============================================
// Database Utilities
// ============================================

export async function clearAllData(): Promise<void> {
  await Promise.all([
    db.cases.clear(),
    db.tasks.clear(),
    db.documents.clear(),
    db.clients.clear(),
  ]);
}

export async function exportData(): Promise<{
  cases: Case[];
  tasks: Task[];
  clients: Client[];
  documents: StoredDocument[];
  exportedAt: string;
}> {
  const [cases, tasks, clients, documents] = await Promise.all([
    db.cases.toArray(),
    db.tasks.toArray(),
    db.clients.toArray(),
    db.documents.toArray(),
  ]);
  
  return {
    cases,
    tasks,
    clients,
    documents,
    exportedAt: new Date().toISOString(),
  };
}

export async function importData(data: {
  cases?: Case[];
  tasks?: Task[];
  clients?: Client[];
}): Promise<void> {
  if (data.cases?.length) {
    await db.cases.bulkPut(data.cases);
  }
  if (data.tasks?.length) {
    await db.tasks.bulkPut(data.tasks);
  }
  if (data.clients?.length) {
    await db.clients.bulkPut(data.clients);
  }
}
