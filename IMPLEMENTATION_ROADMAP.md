# DocketDive Knowledge Base Expansion - Implementation Roadmap

## Overview

**Goal**: Remove tool feature + expand knowledge base to 90%+ success rate

**Timeline**: 6 days

**Effort**: ~26 hours

---

## Phase 1: Remove Tool Invocation Feature (Day 1 - 3 hours)

### Step 1.1: Modify ChatContext.tsx

**File**: `app/context/ChatContext.tsx`

**Action**: Remove tool detection code (lines 188-198)

```typescript
// REMOVE THIS ENTIRE BLOCK:
// Check for tool invocation (only if confidence is high enough)
const toolDetector = await import("@/lib/tool-detector");
const detectedTool = toolDetector.detectToolInvocation(rawMessage);
const toolInvocation = detectedTool && detectedTool.confidence >= 0.7 ? detectedTool : undefined;

// Redirect to tool if detected
if (toolInvocation) {
  router.push(`/tools/${toolInvocation.toolId}`);
  // Don't send the message to chat if we are redirecting
  return;
}
```

**After removal**: Message goes straight to chat processing

**Time**: 5 min

---

### Step 1.2: Remove Tool Card Display

**File**: `components/ChatBubble.tsx`

**Action**: Find and remove ToolInvocationCard rendering

```typescript
// Find and remove:
{message.toolInvocation && <ToolInvocationCard ... />}
```

**Time**: 5 min

---

### Step 1.3: Update Type Definitions

**File**: `app/types.ts`

**Action**: Remove toolInvocation from Message interface

```typescript
// Remove from Message interface:
toolInvocation?: ToolInvocation;

// Remove ToolInvocation interface if it exists
```

**Time**: 5 min

---

### Step 1.4: Delete Unused Files

**Delete these files entirely**:
1. `lib/tool-detector.ts`
2. `components/ToolInvocationCard.tsx`
3. `TOOL_INVOCATION_FEATURE.md`
4. `scripts/test-tool-detection.ts`

**Time**: 5 min

---

### Step 1.5: Test & Verify

**Commands**:
```bash
npm run dev
```

**Manual Testing**:
1. Open chat
2. Type: "analyze this contract" (would have triggered tool before)
3. Verify: Message goes to chat, doesn't redirect

**Expected**: Chat responds with answer, no tool redirection

**Time**: 10 min

---

## Phase 2: Enhance SAFLII Scraper (Days 2-3 - 8 hours)

### Step 2.1: Analyze Current SAFLII Scraper

**File**: `scripts/safliiScraper.ts`

**What to check**:
- Current court types supported
- Chunking strategy
- Metadata extraction

**Time**: 1 hour

---

### Step 2.2: Enhance for Labour Court

**Priority**: Unfair dismissal cases

**Modifications**:
```typescript
// Add to COURT_CODES or make court parameter:
const COURTS_TO_SCRAPE = [
  'ZACC',    // Constitutional Court (existing)
  'ZASCA',   // Appeal Court (existing)
  'ZALC',    // Labour Court (NEW)
  'ZALAC',   // Labour Appeal Court (NEW)
];

// Add specific queries:
const QUERIES = [
  'unfair dismissal',
  'fair procedure',
  'substantive fairness',
  'remedies reinstatement',
];
```

**Time**: 2 hours

---

### Step 2.3: Improve Chunking Strategy

**Current issue**: May split text awkwardly

**Enhancement**:
```typescript
// Smart chunking by paragraph/section boundaries
function intelligentChunk(text: string, maxChunkSize: number = 1500) {
  const paragraphs = text.split('\n\n');
  const chunks = [];
  let currentChunk = '';
  
  for (const para of paragraphs) {
    if ((currentChunk + para).length > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = para;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    }
  }
  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}
```

**Time**: 2 hours

---

### Step 2.4: Enhance Metadata Extraction

**Add to metadata**:
```typescript
// Extract and store:
{
  source: 'SAFLII',
  court: 'ZALC',
  caseNumber: '...',
  date: '...',
  parties: '...',
  judges: '...',
  citation: '...',
  topics: ['unfair dismissal', 'remedies'],  // NEW
  outcome: 'applicant succeeded',             // NEW
  principlesEstablished: ['...'],             // NEW
}
```

**Time**: 1.5 hours

---

### Step 2.5: Test Enhanced Scraper

**Command**:
```bash
npm run test-scraper
```

**Verification**:
- ✅ Labour court cases retrieved
- ✅ Proper chunking
- ✅ Metadata complete
- ✅ ~500 new documents

**Time**: 1.5 hours

---

## Phase 3: Scrape Government Acts (Days 4-5 - 10 hours)

### Step 3.1: Create Gov.za Scraper

**New file**: `scripts/scrape-legislation.ts`

**Structure**:
```typescript
// scrape-legislation.ts
import Firecrawl from "@mendable/firecrawl-js";
import { DataAPIClient } from "@datastax/astra-db-ts";

const ACTS_TO_SCRAPE = [
  {
    name: "Succession Act 1950",
    urls: ["https://www.gov.za/documents/succession-act-1950"],
    topics: ["witness", "will", "testament"],
    priority: "critical"
  },
  {
    name: "PIE Act 1998",
    urls: ["https://www.gov.za/documents/prevention-illegal-eviction-act-1998"],
    topics: ["eviction", "illegal occupation", "notice"],
    priority: "critical"
  },
  {
    name: "Labour Relations Act 1995",
    urls: ["https://www.gov.za/documents/labour-relations-act-1995"],
    topics: ["dismissal", "unfair", "remedies"],
    priority: "critical"
  },
  // ... more acts
];

async function scrapeAct(act) {
  // Use Firecrawl to get full text
  // Parse by sections/subsections
  // Add metadata with act name, topic tags
  // Chunk intelligently
  // Store with vectors
}

async function main() {
  for (const act of ACTS_TO_SCRAPE) {
    await scrapeAct(act);
  }
}
```

**Time**: 3 hours

---

### Step 3.2: Scrape Succession Act 1950

**Focus**: Witness requirements, will formalities

**Extract & Structure**:
```
- Section 2: Formalities of wills
- Section 3: Who can be testator
- Section 4: Witnesses (age, competency)
- Section 5: Attestation requirements
- Sections 23-25: Intestate succession
```

**Chunk by section** - easier to understand

**Time**: 2 hours

---

### Step 3.3: Scrape PIE Act 1998

**Focus**: Eviction procedures, timelines

**Extract & Structure**:
```
- Section 2: When Act applies
- Section 4: Notice to occupy
- Section 5: Court procedures
- Section 6: Timelines and relief
- Schedule: Notice requirements
```

**Time**: 2 hours

---

### Step 3.4: Scrape Labour Relations Act 1995

**Focus**: Unfair dismissal, remedies

**Extract & Structure**:
```
- Section 186: What is unfair dismissal
- Section 193: Remedies
- Section 194: Fairness requirements
- Schedule 8: Code of good practice
```

**Time**: 2 hours

---

### Step 3.5: Add Constitution & Court Rules

**Additional sources**:
1. South African Constitution (Bill of Rights)
2. Uniform Rules of Court
3. High Court Rules

**Time**: 1 hour

---

## Phase 4: Add Contract Law Resources (Days 5 - 6 hours)

### Step 4.1: Identify Contract Law Sources

**Sources to use**:
1. SAFLII - Contract law cases (enhanced query)
2. Government - Standard contract templates
3. Law firms - Model contracts (publicly available)
4. Academic - Contract law principles

**Time**: 1 hour

---

### Step 4.2: Enhanced SAFLII Query for Contracts

**Add to existing scraper**:
```typescript
const CONTRACT_QUERIES = [
  'contract formation agreement',
  'contract interpretation terms',
  'exclusion clauses conditions',
  'breach of contract remedies',
  'misrepresentation mistake contract',
  'contract variation amendment',
];
```

**Time**: 1 hour

---

### Step 4.3: Scrape Model Contracts

**From government & business sources**:
```typescript
const MODEL_CONTRACTS = [
  'Sale of property agreement',
  'Service agreement',
  'Employment contract',
  'Lease agreement',
  'Loan agreement',
];
```

**Time**: 2 hours

---

### Step 4.4: Extract Contract Principles

**From case law and commentary**:
- Common law principles
- Statutory provisions
- Interpretation rules
- Practical guidance

**Time**: 1.5 hours

---

### Step 4.5: Integrate & Test

**Commands**:
```bash
npm run ingest -- ./data/contracts/
npm run reembed-docs
```

**Time**: 0.5 hours

---

## Phase 5: Re-embed Everything (Day 6 - 2 hours)

### Step 5.1: Clear Old Embeddings

**Optional** - only if needed:
```bash
npm run clear-db  # WARNING: Destructive
```

**Or**:
```bash
npm run reembed-docs  # Safer - re-embeds existing
```

**Time**: 0.5 hours

---

### Step 5.2: Re-embed All Documents

**Command**:
```bash
npm run reembed-docs
```

**What it does**:
1. Fetches all documents from Astra DB
2. Generates HuggingFace embeddings (1024-dim)
3. Stores vectors in `$vector` field
4. Updates all documents

**Expected time**: 30-60 min depending on document count

**Time**: 1 hour

---

### Step 5.3: Verify Embeddings

**Command**:
```bash
npm run diagnose-rag
```

**Expected output**:
```
✅ Astra DB Connection
✅ Document Count: 3,000+ (up from ~1,500)
✅ Vector Dimensions: 1024
✅ Keyword Search: witness, age, 14, contract, etc.
🏥 Overall Health: 100%
```

**Time**: 0.5 hours

---

## Phase 6: Test & Verify (Day 6 - 3 hours)

### Step 6.1: Vector Search Test

**Command**:
```bash
npm run test:comprehensive
```

**Expected results**:
```
Test 1: Vector Search
Total: 24 queries
Expected: 24/24 passed (100%)
```

**Time**: 1 hour

---

### Step 6.2: Multi-Prompt Test

**Command**:
```bash
npm run dev              # Terminal 1
npm run test:prompts     # Terminal 2 (after server starts)
```

**Expected results**:
```
Test 2: Conversations
Total: 24 prompts
Expected: 22-24 successful (90%+)

Topics:
  - Witness Age: 4/4 ✅
  - Eviction: 4/4 ✅
  - Labor: 4/4 ✅
  - Inheritance: 4/4 ✅
  - Will Execution: 4/4 ✅
  - Contract Law: 4/4 ✅ (improved from 1/4)
```

**Time**: 1 hour

---

### Step 6.3: Verify Improvements

**Checklist**:
```
✅ Tool feature removed (no redirects)
✅ Chat stays focused on Q&A
✅ Contract Law success: 75%+ (from 25%)
✅ Will Execution: 95%+ (from 75%)
✅ Overall success: 90%+ (from 83.3%)
✅ All main topics: 95%+ success
```

**Time**: 1 hour

---

## Daily Schedule

### Day 1: Remove Tools
```
Morning (3 hours):
  - Modify ChatContext
  - Remove tool cards
  - Update types
  - Delete unused files
  - Test chat

Afternoon:
  - Documentation
  - Code review
```

### Days 2-3: SAFLII Enhancement
```
Day 2 (4 hours):
  - Analyze current scraper
  - Add Labour Court
  - Improve chunking
  
Day 3 (4 hours):
  - Add metadata
  - Test scraper
  - Run scrape job
```

### Days 4-5: Government Acts
```
Day 4 (5 hours):
  - Create legislation scraper
  - Scrape Succession Act
  - Scrape PIE Act
  
Day 5 (5 hours):
  - Scrape Labour Relations Act
  - Add Constitution & rules
  - Integrate & test
```

### Day 6: Test & Deploy
```
Morning (3 hours):
  - Re-embed documents
  - Run comprehensive test
  - Verify improvements
  
Afternoon:
  - Documentation
  - Deploy
```

---

## Success Checklist

### Phase 1: Tool Removal
- [ ] ChatContext.tsx modified
- [ ] Tool cards removed
- [ ] Types updated
- [ ] Files deleted
- [ ] Chat tested

### Phase 2: SAFLII Enhancement
- [ ] Labour Court added
- [ ] Chunking improved
- [ ] Metadata enhanced
- [ ] 500+ new documents
- [ ] Tests passed

### Phase 3: Acts Scraping
- [ ] Succession Act scraped
- [ ] PIE Act scraped
- [ ] Labour Relations Act scraped
- [ ] Constitution added
- [ ] 1000+ new documents

### Phase 4: Contract Law
- [ ] Contract cases scraped
- [ ] Model contracts added
- [ ] Principles extracted
- [ ] 200+ documents
- [ ] Tests passed

### Phase 5: Re-embedding
- [ ] All documents re-embedded
- [ ] Health check: 100%
- [ ] Vector count verified

### Phase 6: Verification
- [ ] Vector test: 100% pass
- [ ] Prompt test: 90%+ success
- [ ] Contract Law: 75%+ (from 25%)
- [ ] All topics: 90%+ success
- [ ] Deployment ready

---

## Expected Improvements

### Before
```
Tool Feature: ENABLED (redirects users)
Vector Test: 100% ✅
Prompt Test: 83.3% ⚠️
Contract Law: 25% ❌
Overall: 83.3%
```

### After
```
Tool Feature: REMOVED ✅
Vector Test: 100% ✅
Prompt Test: 93%+ ✅
Contract Law: 80%+ ✅
Overall: 93%+ ✅
```

---

## Notes & Tips

1. **Firecrawl**: Already set up, use aggressively for scraping
2. **Chunking**: Smart chunking by paragraphs > simple splitting
3. **Metadata**: More metadata = better filtering later
4. **Re-embedding**: Allow 30-60 min, run overnight if needed
5. **Testing**: Always test after each phase

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Scraping too slow | Run multiple scrapers in parallel |
| Documents too many | Start with critical tier only |
| Embeddings fail | Check API key, retry with fewer docs |
| Tests still low | Check chunking, metadata quality |
| Deployment issues | Test locally first, use staging |

---

## Next Steps

1. **Confirm this plan** - Any changes?
2. **Start Day 1** - Remove tool feature
3. **Daily updates** - Track progress
4. **Adjust as needed** - Adapt based on results

Ready to start?

---

**Estimated Total Time**: 26 hours over 6 days
**Expected ROI**: 83% → 93% success rate (+10%)
