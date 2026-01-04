// types/legal-tools.ts
// Shared TypeScript interfaces for DocketDive legal tools

// ============================================
// Contract Analysis Types
// ============================================

export type AnalysisPerspective = 'party_a' | 'party_b' | 'neutral';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface ClauseAnalysis {
  clauseNumber: string;
  clauseText: string;
  category: ClauseCategory;
  riskLevel: RiskLevel;
  explanation: string;
  suggestedModification?: string;
}

export interface ModificationSuggestion {
  clauseReference: string;
  currentText: string;
  suggestedText: string;
  rationale: string;
  priority: 'critical' | 'recommended' | 'optional';
}

export interface ContractAnalysis {
  perspective: AnalysisPerspective;
  riskScore: number; // 0-100
  favorableClauses: ClauseAnalysis[];
  riskyClauses: ClauseAnalysis[];
  modificationSuggestions: ModificationSuggestion[];
  summary: string;
  contractType?: string;
  generatedAt: string;
  clauses?: ClauseAnalysis[];
}

export interface ContractAnalysisRequest {
  content: string;
  perspective: AnalysisPerspective;
  contractType?: string;
}

export interface ContractAnalysisResponse {
  analysis: ContractAnalysis;
  processingTime: number;
  generatedAt: string;
}

// ============================================
// Document Simplification Types
// ============================================

export interface SimplifiedClause {
  original: string;
  simplified: string;
  importance: 'critical' | 'important' | 'standard';
}

export interface JargonTerm {
  term: string;
  definition: string;
  context?: string;
}

export interface Obligation {
  description: string;
  deadline?: string;
  party?: string;
}

export interface Right {
  description: string;
  conditions?: string;
  party?: string;
}

export interface Deadline {
  description: string;
  date?: string;
  consequence?: string;
}

export interface FlowchartNode {
  id: string;
  label: string;
  type: 'start' | 'end' | 'decision' | 'action';
}

export interface FlowchartEdge {
  from: string;
  to: string;
  label?: string;
}

export interface FlowchartData {
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
}

export interface ReadabilityScores {
  original: number; // Grade level
  simplified: number;
}

export interface SimplificationResult {
  originalText: string;
  simplifiedSummary: string;
  clauseBreakdown: SimplifiedClause[];
  jargonGlossary: JargonTerm[];
  keyObligations: Obligation[];
  keyRights: Right[];
  keyDeadlines: Deadline[];
  flowchart?: FlowchartData;
  readabilityScores: ReadabilityScores;
  generatedAt: string;
}

export interface SimplifyRequest {
  content: string;
  includeFlowchart?: boolean;
  targetReadingLevel?: number; // Grade level (default: 8)
}

// ============================================
// Clause Extraction Types
// ============================================

export type ClauseCategory =
  | 'termination'
  | 'indemnity'
  | 'confidentiality'
  | 'limitation_of_liability'
  | 'force_majeure'
  | 'governing_law'
  | 'dispute_resolution'
  | 'payment_terms'
  | 'warranties'
  | 'ip_rights'
  | 'non_compete'
  | 'assignment'
  | 'amendment'
  | 'notices'
  | 'entire_agreement'
  | 'data_protection'
  | 'insurance'
  | 'audit_rights'
  | 'other';

export interface ExtractedClause {
  id: string;
  text: string;
  category: ClauseCategory;
  confidence: number; // 0-100
  isStandard: boolean;
  unusualLanguage?: string[];
  suggestedStandardText?: string;
  location?: string;
}

export interface MissingClause {
  category: ClauseCategory;
  importance: 'critical' | 'recommended' | 'optional';
  suggestedText: string;
  reason: string;
}

export interface ClauseExtractionSummary {
  totalClauses: number;
  categorizedClauses: number;
  unusualClauses: number;
  missingCritical: number;
  missingRecommended: number;
}

export interface ClauseExtractionResult {
  contractType: string;
  typeConfidence: number;
  clauses: ExtractedClause[];
  missingClauses: MissingClause[];
  summary: ClauseExtractionSummary;
  recommendations: string[];
  generatedAt: string;
}

// ============================================
// Case Management Types
// ============================================

export type CaseType =
  | 'civil_litigation'
  | 'criminal'
  | 'family'
  | 'commercial'
  | 'labour'
  | 'property'
  | 'estate'
  | 'administrative'
  | 'constitutional'
  | 'other';

export type CaseStatus = 'active' | 'pending' | 'closed' | 'on_hold';

export interface CaseDeadline {
  id: string;
  title: string;
  date: string;
  type: 'court_date' | 'filing_deadline' | 'meeting' | 'limitation' | 'other';
  completed: boolean;
  notes?: string;
  reminderDays?: number;
}

export interface CaseNote {
  id: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DocumentRef {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  size?: number;
}

export interface Case {
  id: string;
  caseNumber?: string;
  title: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  caseType: CaseType;
  status: CaseStatus;
  description?: string;
  createdAt: string;
  updatedAt: string;
  deadlines: CaseDeadline[];
  documents: DocumentRef[];
  notes: CaseNote[];
  tags?: string[];
}

export interface CaseStats {
  total: number;
  active: number;
  pending: number;
  closed: number;
  onHold: number;
  upcomingDeadlines: number;
}

// ============================================
// Task Management Types
// ============================================

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  description?: string;
  caseId?: string;
  caseName?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  tags?: string[];
}

export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
}

// ============================================
// Document Generation Types
// ============================================

export type DocumentTemplateType =
  | 'letter_of_demand'
  | 'power_of_attorney'
  | 'affidavit'
  | 'notice_to_vacate'
  | 'acknowledgment_of_debt'
  | 'cession_agreement'
  | 'settlement_agreement'
  | 'notice_of_motion'
  | 'founding_affidavit';

export interface TemplateField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'number' | 'select' | 'currency';
  required: boolean;
  placeholder?: string;
  options?: string[]; // For select type
  validation?: string; // Regex pattern
}

export interface DocumentTemplate {
  id: string;
  name: string;
  type: DocumentTemplateType;
  description: string;
  category: string;
  fields: TemplateField[];
  template: string; // Template with {{field_name}} placeholders
}

export interface GenerateDocumentRequest {
  templateId: string;
  fields: Record<string, string>;
  format?: 'docx' | 'pdf' | 'txt';
}

export interface GeneratedDocument {
  content: string;
  templateName: string;
  generatedAt: string;
  fields: Record<string, string>;
}

// ============================================
// Client/CRM Types (Future)
// ============================================

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Utility Types
// ============================================

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Helper function to check if a task is overdue
export function isTaskOverdue(task: Task): boolean {
  if (task.status === 'completed' || !task.dueDate) return false;
  return new Date(task.dueDate) < new Date();
}

// Helper function to check if a deadline is approaching (within N days)
export function isDeadlineApproaching(deadline: CaseDeadline, days: number = 7): boolean {
  if (deadline.completed) return false;
  const deadlineDate = new Date(deadline.date);
  const now = new Date();
  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= days;
}

// Helper function to calculate case age in days
export function calculateCaseAge(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = now.getTime() - created.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}
