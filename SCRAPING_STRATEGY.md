# Legal Scraping Strategy for DocketDive

## Overview
This document outlines legally and ethically sound sources for scraping South African legal content (cases and legislation). Focus: publicly available, legally scrapable sources with proper attribution.

---

## TIER 1: Legally Safe & Priority (High-Value)

### 1. **SAFLII** (Southern African Legal Information Institute)
**Status**: ✅ Already implemented
- **URL**: https://www.saflii.org
- **License**: Creative Commons Attribution license (CC-BY)
- **Content**: South African and regional case law
- **Courts Available**: ZACC, ZASCA, Labour Court, High Courts
- **Rate Limit**: Respectful (2s between requests) ✅
- **Current Coverage**: Constitutional Court, SCA, High Courts, Labour Court
- **Enhancement Needed**: Labour Law cases (ZALC) - add more queries, contract law angles
- **Robots.txt**: Respects robots.txt ✅

**Actionable**: Enhance Labour Court scraping with contract law keywords

---

### 2. **Gov.za Legislation Portal**
**Status**: ✅ Already implemented (PDF download)
- **URL**: https://www.gov.za/documents/acts
- **License**: Public domain (South African government)
- **Content**: All enacted legislation, regulations
- **Key Acts to Prioritize**:
  - Constitution of the RSA (1996)
  - Labour Relations Act (1995)
  - Promotion of Access to Information Act (POPIA) (2000)
  - Succession Act (1957)
  - Alienation of Land Act (1981)
  - Bills of Exchange Act (1964)
- **Current Status**: Downloads PDFs, needs OCR/text extraction
- **Challenge**: PDFs need OCR processing
- **Robots.txt**: Respects robots.txt ✅

**Actionable**: Enhance ingest-folder.ts with OCR for scanned PDFs

---

## TIER 2: Legally Accessible (Secondary Priority)

### 3. **JUTA Legal Database** (Limited)
**Status**: ⚠️  Partially accessible
- **URL**: https://www.juta.co.za
- **Content**: Case law, legislation, commentaries
- **Limitation**: Most content behind paywall
- **Option**: Legal practitioner commentaries on Acts (often freely available on their site)
- **Caution**: Check robots.txt and ToS before scraping

**Decision**: Skip for now - risk of ToS violation

---

### 4. **SciELO South Africa** (Academic Content)
**Status**: ✅ Already implemented
- **URL**: https://www.scielo.org.za
- **License**: Open Access (Creative Commons)
- **Content**: Legal journals, case analysis, academic papers
- **Focus**: Labour law, contract law, Constitutional law articles
- **Current Status**: Script exists (scrape-scielo.ts)
- **Robots.txt**: Respects open access ✅

**Actionable**: Prioritize Labour Law and Contract Law articles

---

## TIER 3: Legal/Niche Sources (Tertiary)

### 5. **Lawsa (Law of South Africa)**
**Status**: ❌ Behind paywall
- **Decision**: Skip - subscription required

---

### 6. **Court Rules & Practice Directions**
**Status**: ⚠️  Accessible but varies by court
- **Sources**:
  - Constitutional Court: https://www.concourt.org.za/
  - Supreme Court of Appeal: https://www.sca.org.za/
  - High Courts: Individual provincial courts
- **Challenge**: Not standardized, some courts protect PDFs
- **Recommendation**: Manual collection + citation linking to SAFLII

**Decision**: Lower priority for now

---

## NOT RECOMMENDED (Legal/Ethical Issues)

### ❌ LexisNexis, Westlaw
- Proprietary content behind paywalls
- ToS violation risk

### ❌ Scraping Google Scholar
- ToS violation
- Google explicitly forbids bot access

### ❌ Court websites (direct scraping)
- Varies by jurisdiction; many have explicit anti-scraping policies
- Risk of IP blocking

---

## IMPLEMENTATION ROADMAP

### Phase 1: Enhance SAFLII (2-3 hours)
**Goal**: Improve Labour Law & Contract Law coverage

**Changes to `safliiScraper.ts`**:
```typescript
// Add Labour Law specific queries
const LABOUR_LAW_KEYWORDS = [
  "dismissal",
  "unfair dismissal",
  "contract of employment",
  "constructive dismissal",
  "restraint of trade",
  "non-compete",
  "severance",
  "retrenchment"
];

// Enhance case scraping with keyword filtering
// Target: 100+ Labour Court cases with contract angles
```

### Phase 2: Improve Legislation Processing (4-5 hours)
**Goal**: Extract text from Gov.za PDFs with OCR

**Changes to `ingest-folder.ts`**:
```typescript
// Add Tesseract OCR for scanned PDFs
import Tesseract from 'tesseract.js';

// Detect if PDF is scanned vs searchable text
// Use OCR for scanned PDFs
// Extract structured metadata (Act name, sections, year)
```

**Acts to Prioritize**:
1. Constitution (already available)
2. Labour Relations Act (1995)
3. Basic Conditions of Employment Act (1997)
4. Employment Equity Act (1998)
5. POPIA (2000)
6. Bills of Exchange Act (1964)
7. Succession Act (1957)

### Phase 3: Enhance SciELO Scraping (3-4 hours)
**Goal**: Focus on Labour Law and Contract Law articles

**Keywords to Target**:
- Labour law disputes
- Employment contracts
- Constitutional interpretation
- Restraint of trade
- Non-compete clauses

---

## Data Structure for Sources

All ingested data should follow this structure:

```typescript
interface LegalDocument {
  content: string;
  metadata: {
    source: 'SAFLII' | 'Gov.za' | 'SciELO' | 'local_ingestion';
    title: string;
    category: string; // e.g., "Labour Law", "Contract Law", "Constitutional Law"
    citation?: string; // For cases
    court?: string; // For cases
    year?: number;
    url: string;
    authority?: string; // e.g., "Constitutional Court", "Parliament"
    chunkIndex: number;
    totalChunks: number;
  };
  $vector: number[]; // Embedding
}
```

---

## Compliance Checklist

- [x] Respect robots.txt (all sources verified)
- [x] Rate limiting (2s minimum between requests)
- [x] User-Agent identification (DocketDive Legal Research Bot)
- [x] Attribution in metadata
- [x] License compliance (CC-BY, Public Domain)
- [x] No paywall/proprietary content
- [x] No ToS violations

---

## Expected Outcomes

After implementation:

| Source | Current | Target | Focus |
|--------|---------|--------|-------|
| SAFLII Labour | 30 cases | 100+ cases | Labour disputes, contracts |
| Gov.za Acts | 5-10 | 20+ | Legislation with Contract angles |
| SciELO | Basic | Enhanced | Labour & Contract law papers |
| **Total Chunks** | ~500 | ~2000+ | Improved coverage for Contract Law |

---

## Testing Post-Implementation

Run after each phase:
```bash
npm run test:comprehensive  # Vector search accuracy
npm run test:prompts      # LLM integration
```

**Target**: Contract Law accuracy >75% (currently 25%)

