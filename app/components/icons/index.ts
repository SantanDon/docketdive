/**
 * Centralized Icon Management
 * Feature: ui-polish-launch-prep
 * 
 * This file exports all icons used throughout the application for consistency
 * and easy maintenance. All icons are from Lucide React for visual consistency.
 */

// Re-export commonly used icons with descriptive names
export {
  // Legal & Professional Icons
  Scale as ScaleIcon,
  Shield as ShieldIcon,
  ShieldCheck as ShieldCheckIcon,
  Briefcase as BriefcaseIcon,
  FileText as FileTextIcon,
  BookOpen as BookOpenIcon,
  
  // Education & Learning Icons
  GraduationCap as GraduationCapIcon,
  Library as LibraryIcon,
  
  // UI & Navigation Icons
  Home as HomeIcon,
  User as UserIcon,
  Bot as BotIcon,
  Send as SendIcon,
  Paperclip as PaperclipIcon,
  ArrowRight as ArrowRightIcon,
  Upload as ArrowUpTrayIcon,
  
  // Feedback & Status Icons
  Sparkles as SparklesIcon,
  Lightbulb as LightbulbIcon,
  Info as InfoIcon,
  Loader2 as LoaderIcon,
  
  // Interaction Icons
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
  ExternalLink as ExternalLinkIcon,
  
  // Theme Icons
  Sun as SunIcon,
  Moon as MoonIcon,
  
  // Search Icons
  Search as SearchIcon,
  X as CloseIcon,
} from 'lucide-react';

/**
 * Icon Size Standards
 * 
 * Use these standard sizes for consistency:
 * - xs: 12px (h-3 w-3) - Very small icons in dense UI
 * - sm: 14px (h-3.5 w-3.5) - Small icons in pills, badges
 * - md: 16px (h-4 w-4) - Default icon size for buttons
 * - lg: 20px (h-5 w-5) - Larger icons for emphasis
 * - xl: 24px (h-6 w-6) - Extra large for hero sections
 */

export const IconSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
} as const;

/**
 * Icon Color Standards
 * 
 * Theme-aware color classes for icons:
 * - primary: text-blue-600 dark:text-blue-400
 * - secondary: text-gray-600 dark:text-gray-400
 * - muted: text-gray-500 dark:text-gray-500
 * - accent: text-cyan-600 dark:text-cyan-400
 * - success: text-green-600 dark:text-green-400
 * - warning: text-amber-600 dark:text-amber-400
 * - error: text-red-600 dark:text-red-400
 */

export const IconColors = {
  primary: 'text-blue-600 dark:text-blue-400',
  secondary: 'text-gray-600 dark:text-gray-400',
  muted: 'text-gray-500 dark:text-gray-500',
  accent: 'text-cyan-600 dark:text-cyan-400',
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-amber-600 dark:text-amber-400',
  error: 'text-red-600 dark:text-red-400',
} as const;

/**
 * Usage Example:
 * 
 * import { ScaleIcon, IconSizes, IconColors } from '@/app/components/icons';
 * 
 * <ScaleIcon 
 *   size={IconSizes.md} 
 *   className={IconColors.primary}
 * />
 */
