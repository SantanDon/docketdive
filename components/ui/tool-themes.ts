// Tool-specific theme configuration for DocketDive legal tools
// Provides unique visual identity for each legal tool

export type ToolTheme = {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  gradient: string;
  icon: string;
  description: string;
  uploadMessage: string;
  headerBg: string;
  cardBg: string;
  buttonStyle: string;
  textColor: string;
  borderColor: string;
};

export const toolThemes: Record<string, ToolTheme> = {
  auditor: {
    name: "Contract Auditor",
    primary: "from-red-500 to-amber-600",
    secondary: "from-red-400 to-amber-500",
    accent: "from-amber-400 to-orange-500",
    gradient: "bg-gradient-to-br from-red-500/10 via-amber-500/5 to-orange-500/10",
    icon: "Shield",
    description: "Audit contracts for missing or risky legal provisions",
    uploadMessage: "Upload your contract for comprehensive clause analysis",
    headerBg: "bg-gradient-to-br from-red-500/20 via-amber-500/10 to-orange-500/20",
    cardBg: "bg-gradient-to-br from-red-500/5 via-amber-500/3 to-orange-500/5",
    buttonStyle: "bg-gradient-to-r from-red-500 to-amber-600 hover:from-red-600 hover:to-amber-700",
    textColor: "text-red-600 dark:text-red-400",
    borderColor: "border-red-500/20 dark:border-red-500/30"
  },
  simplifier: {
    name: "Document Simplifier",
    primary: "from-blue-500 to-cyan-600",
    secondary: "from-blue-400 to-cyan-500",
    accent: "from-cyan-400 to-teal-500",
    gradient: "bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-teal-500/10",
    icon: "Sparkles",
    description: "Transform complex legal jargon into clear, actionable language",
    uploadMessage: "Upload complex legal documents for simplification",
    headerBg: "bg-gradient-to-br from-blue-500/20 via-cyan-500/10 to-teal-500/20",
    cardBg: "bg-gradient-to-br from-blue-500/5 via-cyan-500/3 to-teal-500/5",
    buttonStyle: "bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700",
    textColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-500/20 dark:border-blue-500/30"
  },
  drafter: {
    name: "Drafting Assistant",
    primary: "from-slate-600 to-slate-800",
    secondary: "from-slate-500 to-slate-700",
    accent: "from-slate-400 to-slate-600",
    gradient: "bg-gradient-to-br from-slate-500/10 via-slate-500/5 to-slate-400/10",
    icon: "FileSignature",
    description: "Generate professional legal documents with AI-powered precision",
    uploadMessage: "Upload reference documents or provide drafting context",
    headerBg: "bg-gradient-to-br from-slate-500/20 via-slate-500/10 to-slate-400/20",
    cardBg: "bg-gradient-to-br from-slate-500/5 via-slate-500/3 to-slate-400/5",
    buttonStyle: "bg-gradient-to-r from-slate-600 to-slate-800 hover:from-slate-700 hover:to-slate-900",
    textColor: "text-slate-600 dark:text-slate-400",
    borderColor: "border-slate-500/20 dark:border-slate-500/30"
  },
  popia: {
    name: "POPIA Checker",
    primary: "from-rose-500 to-pink-600",
    secondary: "from-rose-400 to-pink-500",
    accent: "from-pink-400 to-fuchsia-500",
    gradient: "bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-fuchsia-500/10",
    icon: "Shield",
    description: "Automated South African data privacy compliance audit",
    uploadMessage: "Upload privacy policies or data processing agreements",
    headerBg: "bg-gradient-to-br from-rose-500/20 via-pink-500/10 to-fuchsia-500/20",
    cardBg: "bg-gradient-to-br from-rose-500/5 via-pink-500/3 to-fuchsia-500/5",
    buttonStyle: "bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700",
    textColor: "text-rose-600 dark:text-rose-400",
    borderColor: "border-rose-500/20 dark:border-rose-500/30"
  }
};

export const getToolTheme = (toolId: string): ToolTheme => {
  const themeMap: Record<string, keyof typeof toolThemes> = {
    'auditor': 'auditor',
    'clause-auditor': 'auditor',
    'simplifier': 'simplifier',
    'simplifier': 'simplifier',
    'simplify': 'simplifier',
    'document-simplifier': 'simplifier',
    'drafter': 'drafter',
    'drafting-assistant': 'drafter',
    'popia': 'popia',
    'popia': 'popia',

    'popia-checker': 'popia',

    'compare': 'auditor', // Fallback or dedicated theme

    'comparison': 'auditor'
  };

  const themeKey = themeMap[toolId] || 'auditor';
  return toolThemes[themeKey as keyof typeof toolThemes]!;
};

// Theme-aware utility functions
export const getThemeClasses = (theme: ToolTheme, element: string) => {
  const classMap: Record<string, string> = {
    header: `${theme.headerBg} border ${theme.borderColor}`,
    card: `${theme.cardBg} border ${theme.borderColor}`,
    button: theme.buttonStyle,
    text: theme.textColor,
    border: theme.borderColor,
    gradient: theme.gradient
  };

  return classMap[element] || '';
};
