# Knowledge Base Expansion & Tool Feature Removal Plan

## Problem Analysis

From the test results:
- **Vector Search**: 100% success ✅
- **LLM Responses**: 83.3% success ⚠️
- **Specific Issues**:
  - Contract Law: Only 25% success (3/4 failed)
  - Will Execution: 75% success (1/4 failed)
  - Edge cases not covered

**Root Cause**: Knowledge base is incomplete. Need more comprehensive legal documents.

---

## Task 1: Remove Tool Invocation Feature

### Files to Modify

#### 1. `app/context/ChatContext.tsx` (Lines 188-198)
**Current behavior**:
```typescript
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

**Action**: Remove lines 183-198 (tool detection and redirection)

#### 2. `components/ChatBubble.tsx`
**Action**: Remove ToolInvocationCard display logic

#### 3. `components/ToolInvocationCard.tsx`
**Action**: Remove or disable component

#### 4. `app/types.ts`
**Action**: Remove toolInvocation field from Message type

#### 5. `lib/tool-detector.ts`
**Action**: Delete this file entirely (not needed)

### Benefits
✅ Users get answers immediately instead of being redirected
✅ Chat stays focused on knowledge base information
✅ No more tool suggestions disrupting conversation
✅ Better UX for Q&A flow

---

## Task 2: Expand Knowledge Base - Scraping Strategy

### Current Scraping Situation

**Already Exists**:
- `scripts/safliiScraper.ts` - SAFLII case scraper
- `scripts/scrape-acts.ts` - Government acts/legislation
- `scripts/scrape-scielo.ts` - Academic articles
- `scripts/firecrawl-ingest.ts` - Main crawler (supports ZACC, ZASCA, etc.)
- `scripts/ingest-folder.ts` - Local document ingestion

**Current Coverage Issues**:
- Limited contract law documents
- Incomplete edge case coverage
- Not all court types fully covered
- Missing some statutory provisions

### Improvement Strategy

#### Phase 1: Enhance SAFLII Scraping

**Current file**: `scripts/safliiScraper.ts`

**What to improve**:
1. **More court types**:
   - Add: Labour Court (LC), Special Court (SC), Land Court (LCC)
   - Currently: ZACC (Constitutional), ZASCA (Appeal)

2. **Better chunking**:
   - Current: Simple text split
   - Improved: Smart chunking by:
     - Judgment paragraphs
     - Headnotes
     - Legal principles
     - Reasoning sections

3. **Enhanced metadata**:
   - Add: Judge names, case keywords, legal topics
   - Add: Citation information
   - Add: Outcome classification (won/lost)

**Implementation**:
```typescript
// Enhance safliiScraper.ts
- Add courtType parameter to query multiple courts
- Improve chunk boundaries (don't split in middle of sentences)
- Extract and tag legal principles
- Add metadata enrichment
```

#### Phase 2: Government & Legislation Expansion

**Current file**: `scripts/scrape-acts.ts`

**What to scrape**:
1. **Succession Act** (for witness/will questions)
   - Full text of Succession Act 1950
   - Amendment acts
   - Regulations and rules

2. **Prevention of Illegal Eviction Act** (PIE)
   - Full statutory text
   - Amendment history
   - Related regulations

3. **Labour Relations Act** (LRA)
   - For dismissal/employment questions
   - All amendments
   - Notices and procedures

4. **POPIA Act**
   - Data protection details
   - Compliance requirements
   - Guidance documents

5. **Constitution**
   - Bill of Rights (Chapter 2)
   - Property rights (Section 25)
   - Foundational values

**Implementation**:
```typescript
// Enhance scrape-acts.ts
- Expand gov.za sources
- Add parliament.gov.za for bills
- Add legal commentary/interpretation
- Chunk by sections and subsections
```

#### Phase 3: Contract Law Documents

**Current issue**: Only 25% success rate

**What to add**:
1. **Model contracts**:
   - Sale of property agreements
   - Service agreements
   - Employment contracts
   - Lease agreements

2. **Contract law principles**:
   - Common law (textbooks)
   - Case law (SAFLII)
   - Commentary and guides

3. **Contract interpretation rules**:
   - Contra proferentem
   - Exclusion clauses
   - Mistake and misrepresentation

**Sources**:
- SAFLII commercial law cases
- Government contract templates
- Law Society publications
- Academic articles

**Implementation**:
```typescript
// New or enhanced scripts
- Expand firecrawl-ingest.ts to target commercial cases
- Add specific contract law sources
- Better metadata tagging for contract topics
```

#### Phase 4: Academic & Commentary Expansion

**Current file**: `scripts/scrape-scielo.ts`

**What to add**:
1. **Legal commentary** (South African law journals)
2. **Practice guides** (from legal organizations)
3. **Textbooks** (where publicly available)
4. **Analysis documents** (case law analysis)

**Sources**:
- SciELO (already used)
- SSRN (academic papers)
- Law blogs and commentaries
- Practice notes from law firms

---

## Task 3: Best Open Source Tools for Scraping & Analysis

### Recommended Tools

#### 1. **Playwright** (Already used) ✅
- For web scraping government sites
- Handles JavaScript-heavy sites
- Good browser automation
- **Status**: Already in use

#### 2. **Firecrawl** (Already used) ✅
- Main crawling engine
- Handles legal document sites well
- Supports sitemap crawling
- **Enhancement**: Use more aggressively for comprehensive crawls

#### 3. **Cheerio** (Already used) ✅
- HTML parsing and extraction
- Lightweight, fast
- Good for static pages
- **Status**: Already in use

#### 4. **LangChain** (Already used) ✅
- Document loading and chunking
- Text splitting strategies
- Embedding generation
- **Enhancement**: Use SmartChunking for legal docs

#### 5. **Puppeteer** (Already available)
- Alternative to Playwright
- Good for JavaScript rendering
- Already installed
- **Use case**: Fallback for dynamic content

#### 6. **PDF-Parse** (Already used) ✅
- PDF text extraction
- Already working
- **Enhancement**: Add OCR for scanned documents

#### 7. **Mammoth** (Already used) ✅
- DOCX parsing
- Already working
- **Status**: Ready to use

#### 8. **New Tool Recommendation: Apify**
- Advanced web scraping
- Cloud-based crawling
- API-first approach
- **Benefit**: Can run scheduled crawls

**Implementation**: Optional, can start without it

---

## Task 4: Implementation Plan

### Step 1: Remove Tool Feature (2 hours)
```
1. Modify ChatContext.tsx - remove tool detection
2. Remove/disable ToolInvocationCard
3. Update types
4. Test chat still works
5. Remove tool-detector.ts
```

### Step 2: Enhance SAFLII Scraper (4 hours)
```
1. Add more court types (LC, SC)
2. Improve chunking logic
3. Add metadata enrichment
4. Test and verify
5. Run comprehensive scrape
```

### Step 3: Expand Gov.za Scraping (4 hours)
```
1. Create enhanced gov.za scraper
2. Target key acts:
   - Succession Act
   - PIE Act
   - LRA
   - POPIA Act
   - Constitution
3. Test extraction
4. Ingest into knowledge base
```

### Step 4: Add Contract Law Sources (6 hours)
```
1. Identify contract law sources
2. Create specialized scraper
3. Get model contracts
4. Extract case law
5. Ingest and chunk
```

### Step 5: Re-embed Everything (2 hours)
```
1. Run npm run reembed-docs
2. Verify all documents embedded
3. Run comprehensive test
4. Check success rate improvement
```

### Step 6: Test & Verify (3 hours)
```
1. Run npm run test:comprehensive
2. Check Contract Law success rate
3. Test edge cases
4. Verify witness/eviction/dismissal/succession
5. Document improvements
```

---

## Expected Improvements

### Before Expansion
```
Vector Test: 100% ✅
Conversation Test: 83.3% ⚠️
  - Witness Age: 100%
  - Eviction: 100%
  - Labor: 100%
  - Inheritance: 100%
  - Will Execution: 75%
  - Contract Law: 25% ❌
```

### After Expansion
```
Expected Results:
  - Witness Age: 100% ✅
  - Eviction: 100% ✅
  - Labor: 100% ✅
  - Inheritance: 100% ✅
  - Will Execution: 95%+ ✅
  - Contract Law: 80%+ ✅
  
Overall Success: 95%+
```

---

## Scraping Sources Priority

### Priority 1: HIGHEST IMPACT
1. **SAFLII Cases** - Court judgments
   - Labour Court cases (unfair dismissal)
   - Commercial/Contract cases
   - Constitutional interpretations

2. **Government Acts**
   - Succession Act 1950
   - PIE Act 1998
   - Labour Relations Act 1995

### Priority 2: HIGH IMPACT
3. **Contract Law Commentary**
   - Case law analysis
   - Practice guides
   - Model contracts

4. **Academic Sources**
   - Law journal articles
   - Textbook excerpts
   - Research papers

### Priority 3: MEDIUM IMPACT
5. **Regulations & Rules**
   - Court rules
   - Procedural guidance
   - Regulatory framework

---

## Technical Stack for Enhanced Scraping

```
├── Web Scraping
│   ├── Playwright (JavaScript)
│   ├── Firecrawl (Main crawler)
│   └── Cheerio (HTML parsing)
│
├── Document Processing
│   ├── PDF-Parse (PDFs)
│   ├── Mammoth (DOCX)
│   ├── Tesseract (OCR)
│   └── document-processor.ts
│
├── Text Processing
│   ├── LangChain (Chunking)
│   ├── Compromise (NLP)
│   └── Text splitting strategies
│
├── Embeddings
│   ├── HuggingFace API (intfloat/multilingual-e5-large)
│   └── Caching system
│
└── Storage
    └── Astra DB (Vector storage)
```

---

## Maintenance Plan

### Weekly
- Monitor scraping jobs
- Check for site changes
- Verify data quality

### Monthly
- Re-scrape frequently updated sources
- Update embeddings for new documents
- Run comprehensive tests

### Quarterly
- Add new legal topics
- Expand source coverage
- Audit knowledge base

---

## File Changes Summary

### Files to Delete
- `lib/tool-detector.ts`
- `components/ToolInvocationCard.tsx`
- `TOOL_INVOCATION_FEATURE.md`
- `test-tool-detection.ts`

### Files to Modify
- `app/context/ChatContext.tsx` (remove tool detection)
- `components/ChatBubble.tsx` (remove tool card display)
- `app/types.ts` (remove toolInvocation field)

### Files to Create/Enhance
- Enhanced `scripts/safliiScraper.ts`
- Enhanced `scripts/scrape-acts.ts`
- New contract law scraper
- Enhanced chunking strategy

---

## Success Metrics

### Current
- Vector Search: 100%
- Conversation: 83.3%
- Contract Law: 25%

### Target
- Vector Search: 100%
- Conversation: 95%+
- Contract Law: 80%+
- All edge cases: <90% failure

---

## Timeline

```
Day 1 (3 hours):
  - Remove tool feature
  - Test chat still works

Days 2-3 (8 hours):
  - Enhance SAFLII scraper
  - Run comprehensive scrape
  - Ingest new documents

Days 4-5 (10 hours):
  - Add gov.za sources
  - Add contract law documents
  - Create specialized scrapers

Day 6 (5 hours):
  - Re-embed everything
  - Run comprehensive tests
  - Verify improvements

Total: 26 hours over 6 days
```

---

## Success Criteria

✅ Tool feature completely removed
✅ Chat no longer redirects to tools
✅ All user questions go to chat directly
✅ Contract Law success rate: >75%
✅ Overall conversation success: >90%
✅ Edge cases handled properly
✅ All 4 main topics at 100%

---

## Next Steps

1. **Confirm approach** - Agree on strategy
2. **Create list of specific sources** - What to scrape
3. **Start with Step 1** - Remove tool feature
4. **Then proceed in order** - SAFLII → Acts → Contract → Test

Ready to proceed?
