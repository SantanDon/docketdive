'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, FileText, Scale, Users, Calendar, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExtractedEntities, CaseCitation, StatuteReference, PartyEntity, DateEntity, LegalTerm } from '@/types/document-processing';

interface EntitySidebarProps {
  entities: ExtractedEntities;
  onEntityClick?: (position: { start: number; end: number }) => void;
  className?: string;
}

type EntityCategory = 'citations' | 'statutes' | 'parties' | 'dates' | 'terms';

// Animation variants
const itemVariants = {
  hidden: { opacity: 0, y: 5 },
  visible: { opacity: 1, y: 0 }
};

export function EntitySidebar({ entities, onEntityClick, className = '' }: EntitySidebarProps) {
  const [activeCategory, setActiveCategory] = useState<EntityCategory>('citations');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const categories: { key: EntityCategory; label: string; count: number; icon: React.ElementType }[] = [
    { key: 'citations', label: 'Citations', count: entities.caseCitations.length, icon: FileText },
    { key: 'statutes', label: 'Statutes', count: entities.statuteReferences.length, icon: Scale },
    { key: 'parties', label: 'Parties', count: entities.parties.length, icon: Users },
    { key: 'dates', label: 'Dates', count: entities.dates.length, icon: Calendar },
    { key: 'terms', label: 'Terms', count: entities.legalTerms.length, icon: BookOpen },
  ];

  const totalEntities = categories.reduce((sum, cat) => sum + cat.count, 0);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn('flex flex-col h-full glass-card', className)}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Extracted Entities</h3>
        <p className="text-sm text-muted-foreground">{totalEntities} entities found</p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1.5 p-3 border-b border-border">
        {categories.map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.key;
          return (
            <motion.button
              key={cat.key}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveCategory(cat.key)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              )}
            >
              <Icon size={12} />
              <span>{cat.label}</span>
              <span className={cn(
                'px-1.5 py-0.5 rounded-full text-[10px] font-medium',
                isActive ? 'bg-primary-foreground/20' : 'bg-muted-foreground/20'
              )}>
                {cat.count}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Entity List */}
      <div className="flex-1 overflow-y-auto p-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {activeCategory === 'citations' && (
              <CitationList citations={entities.caseCitations} expandedItems={expandedItems} onToggle={toggleItem} onEntityClick={onEntityClick} />
            )}
            {activeCategory === 'statutes' && (
              <StatuteList statutes={entities.statuteReferences} expandedItems={expandedItems} onToggle={toggleItem} onEntityClick={onEntityClick} />
            )}
            {activeCategory === 'parties' && (
              <PartyList parties={entities.parties} onEntityClick={onEntityClick} />
            )}
            {activeCategory === 'dates' && (
              <DateList dates={entities.dates} onEntityClick={onEntityClick} />
            )}
            {activeCategory === 'terms' && (
              <TermList terms={entities.legalTerms} expandedItems={expandedItems} onToggle={toggleItem} onEntityClick={onEntityClick} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Citation List Component
function CitationList({ citations, expandedItems, onToggle, onEntityClick }: { 
  citations: CaseCitation[];
  expandedItems: Set<string>;
  onToggle: (id: string) => void;
  onEntityClick?: ((position: { start: number; end: number }) => void) | undefined;
}) {
  if (citations.length === 0) return <EmptyState message="No case citations found" />;

  return (
    <div className="space-y-2">
      {citations.map((citation, idx) => {
        const id = `citation-${idx}`;
        const isExpanded = expandedItems.has(id);
        
        return (
          <motion.div key={id} variants={itemVariants} className="rounded-lg border border-border bg-card/50 overflow-hidden">
            <button onClick={() => onToggle(id)} className="w-full p-3 text-left hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground truncate">{citation.text}</span>
                <ChevronIcon expanded={isExpanded} />
              </div>
            </button>
            
            <AnimatePresence>
              {isExpanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-3 pb-3 space-y-1 text-xs text-muted-foreground border-t border-border pt-2">
                  {citation.year && <div>Year: {citation.year}</div>}
                  {citation.volume && <div>Volume: {citation.volume}</div>}
                  {citation.page && <div>Page: {citation.page}</div>}
                  {citation.court && <div>Court: {citation.court}</div>}
                  <button onClick={() => onEntityClick?.(citation.position)} className="mt-2 text-primary hover:text-primary/80 font-medium">
                    Jump to citation →
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

// Statute List Component
function StatuteList({ statutes, expandedItems, onToggle, onEntityClick }: { 
  statutes: StatuteReference[];
  expandedItems: Set<string>;
  onToggle: (id: string) => void;
  onEntityClick?: ((position: { start: number; end: number }) => void) | undefined;
}) {
  if (statutes.length === 0) return <EmptyState message="No statute references found" />;

  return (
    <div className="space-y-2">
      {statutes.map((statute, idx) => {
        const id = `statute-${idx}`;
        const isExpanded = expandedItems.has(id);
        
        return (
          <motion.div key={id} variants={itemVariants} className="rounded-lg border border-border bg-card/50 overflow-hidden">
            <button onClick={() => onToggle(id)} className="w-full p-3 text-left hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground truncate">{statute.actName || statute.text}</span>
                <ChevronIcon expanded={isExpanded} />
              </div>
            </button>
            
            <AnimatePresence>
              {isExpanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-3 pb-3 space-y-1 text-xs text-muted-foreground border-t border-border pt-2">
                  <div>Full text: {statute.text}</div>
                  {statute.section && <div>Section: {statute.section}</div>}
                  {statute.subsection && <div>Subsection: {statute.subsection}</div>}
                  <button onClick={() => onEntityClick?.(statute.position)} className="mt-2 text-primary hover:text-primary/80 font-medium">
                    Jump to reference →
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}


// Party List Component
function PartyList({ parties, onEntityClick }: { 
  parties: PartyEntity[];
  onEntityClick?: ((position: { start: number; end: number }) => void) | undefined;
}) {
  if (parties.length === 0) return <EmptyState message="No parties identified" />;

  const roleColors: Record<string, string> = {
    plaintiff: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
    defendant: 'bg-destructive/10 text-destructive border-destructive/20',
    applicant: 'bg-primary/10 text-primary border-primary/20',
    respondent: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    appellant: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    other: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <div className="space-y-2">
      {parties.map((party, idx) => (
        <motion.button
          key={`party-${idx}`}
          variants={itemVariants}
          whileHover={{ y: -1 }}
          onClick={() => onEntityClick?.(party.position)}
          className="w-full p-3 rounded-lg border border-border bg-card/50 text-left hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">{party.name}</span>
            <span className={cn('px-2 py-0.5 text-xs rounded-full border', roleColors[party.role])}>{party.role}</span>
          </div>
        </motion.button>
      ))}
    </div>
  );
}

// Date List Component
function DateList({ dates, onEntityClick }: { 
  dates: DateEntity[];
  onEntityClick?: ((position: { start: number; end: number }) => void) | undefined;
}) {
  if (dates.length === 0) return <EmptyState message="No dates found" />;

  const typeColors: Record<string, string> = {
    deadline: 'bg-destructive/10 text-destructive border-destructive/20',
    event: 'bg-primary/10 text-primary border-primary/20',
    reference: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <div className="space-y-2">
      {dates.map((date, idx) => (
        <motion.button
          key={`date-${idx}`}
          variants={itemVariants}
          whileHover={{ y: -1 }}
          onClick={() => onEntityClick?.(date.position)}
          className="w-full p-3 rounded-lg border border-border bg-card/50 text-left hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">{date.text}</span>
            <span className={cn('px-2 py-0.5 text-xs rounded-full border', typeColors[date.type])}>{date.type}</span>
          </div>
          {date.date && (
            <div className="text-xs text-muted-foreground mt-1">{date.date.toLocaleDateString()}</div>
          )}
        </motion.button>
      ))}
    </div>
  );
}

// Term List Component
function TermList({ terms, expandedItems, onToggle, onEntityClick }: { 
  terms: LegalTerm[];
  expandedItems: Set<string>;
  onToggle: (id: string) => void;
  onEntityClick?: ((position: { start: number; end: number }) => void) | undefined;
}) {
  if (terms.length === 0) return <EmptyState message="No legal terms found" />;

  return (
    <div className="space-y-2">
      {terms.map((term, idx) => {
        const id = `term-${idx}`;
        const isExpanded = expandedItems.has(id);
        
        return (
          <motion.div key={id} variants={itemVariants} className="rounded-lg border border-border bg-card/50 overflow-hidden">
            <button onClick={() => onToggle(id)} className="w-full p-3 text-left hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {term.term}
                  {term.isLatin && (
                    <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded border border-purple-200 dark:border-purple-800">
                      Latin
                    </span>
                  )}
                </span>
                <ChevronIcon expanded={isExpanded} />
              </div>
            </button>
            
            <AnimatePresence>
              {isExpanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-3 pb-3 space-y-2 border-t border-border pt-2">
                  <p className="text-xs text-muted-foreground">{term.definition}</p>
                  <button onClick={() => onEntityClick?.(term.position)} className="text-xs text-primary hover:text-primary/80 font-medium">
                    Jump to term →
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

// Helper Components
function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
      <ChevronDown size={16} className="text-muted-foreground" />
    </motion.div>
  );
}

export default EntitySidebar;
