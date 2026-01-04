# Comprehensive Scraping Sources for DocketDive

## Tier 1: CRITICAL SOURCES (Must Scrape)

### 1. SAFLII - South African Legal Information Institute
**URL**: https://www.saflii.org
**What**: Court judgments, case law, legislation

#### Courts to Scrape
```
HIGHEST PRIORITY:
  - ZACC (Constitutional Court) - already started
  - ZASCA (Supreme Court of Appeal) - already started
  - ZALC (Labour Court) - PRIORITY: unfair dismissal cases
  
HIGH PRIORITY:
  - ZAWC (Western Cape High Court) - commercial cases
  - ZAGJ (Gauteng High Court) - commercial/contract cases
  - ZAKZN (KwaZulu-Natal High Court) - general cases
  
MEDIUM PRIORITY:
  - ZACC (All Constitutional cases - comprehensive)
  - ZALAC (Labour Appeal Court) - employment matters
  - ZAFSHC (Full High Court - all divisions)
```

**How to Scrape**:
```typescript
// Use firecrawl-ingest.ts with court codes
// Add specific queries:
// - "contract" for contract law
// - "witness" for succession law
// - "dismissal unfair" for labor law
// - "eviction" for property law
// - "agreement" for commercial law
```

**Expected Documents**: 5,000+ case judgments
**Topics Covered**: All major legal areas

---

### 2. South African Government - Acts & Legislation
**URL**: https://www.gov.za

#### Key Acts to Scrape (COMPLETE)

```
1. SUCCESSION ACT 1950
   URL Pattern: https://www.gov.za/documents/succession-act-1950
   Topics:
     - Will requirements
     - Witness age (14 years)
     - Witness competency
     - Will formalities
     - Intestate succession
   Priority: CRITICAL

2. PREVENTION OF ILLEGAL EVICTION ACT (PIE) 1998
   URL Pattern: https://www.gov.za/documents/prevention-illegal-eviction-act-1998
   Topics:
     - Eviction procedures
     - Notice requirements
     - Court orders
     - Timeline for process
     - Rights of occupation
   Priority: CRITICAL

3. LABOUR RELATIONS ACT 1995
   URL Pattern: https://www.gov.za/documents/labour-relations-act-1995
   Topics:
     - Unfair dismissal
     - Remedies (reinstatement, compensation)
     - Fair procedure
     - Substantive fairness
     - CCMA procedures
   Priority: CRITICAL

4. PROMOTION OF ACCESS TO INFORMATION ACT (PAIA) 2000
   URL Pattern: https://www.gov.za/documents/promotion-access-information-act-2000
   Topics:
     - Information requests
     - Procedure and timelines
   Priority: MEDIUM

5. PROTECTION OF PERSONAL INFORMATION ACT (POPIA) 2013
   URL Pattern: https://www.gov.za/documents/protection-personal-information-act-2013
   Topics:
     - Data protection
     - Privacy rights
     - Compliance obligations
   Priority: MEDIUM

6. CONSTITUTION OF THE REPUBLIC OF SOUTH AFRICA 1996
   URL Pattern: https://www.gov.za/documents/constitution-republic-south-africa-1996
   Topics:
     - Bill of Rights
     - Property rights
     - Dignity and privacy
     - Legal principles
   Priority: HIGH

7. CIVIL PROCEDURE ACT & RULES
   URL Pattern: https://www.gov.za/documents/rules-court
   Topics:
     - Court procedures
     - Evidence rules
     - Pleading requirements
   Priority: MEDIUM

8. MARRIAGE ACT 1961 & MATRIMONIAL PROPERTY ACT 1984
   For: Context on family law, property
   Priority: MEDIUM
```

**How to Scrape**:
```bash
# Create new script: scripts/scrape-legislation.ts
# Target: gov.za legislation portal
# Extract: Full text + amendments
# Chunk by: Sections, subsections
```

**Expected Documents**: 500+ legislative provisions

---

## Tier 2: HIGH-PRIORITY SOURCES

### 3. Government Gazette
**URL**: https://www.gov.za/gazette

**What to Scrape**:
- Regulations related to acts
- Government notices
- Proclamations
- Court rules amendments

**Topics**:
- Rules updates
- Procedure changes
- Regulatory changes

**Priority**: MEDIUM

---

### 4. Law Society of South Africa
**URL**: https://www.lssa.org.za

**What to Scrape**:
- Practice directives
- Professional guidelines
- Opinion pieces
- Compliance guidance

**Topics**:
- Legal ethics
- Professional requirements
- Practice standards

**Priority**: LOW-MEDIUM

---

### 5. Legal Research & Commentary Sources

#### A. University Law Departments
**URLs**:
- University of Stellenbosch: https://www.sun.ac.za
- University of Cape Town: https://www.uct.ac.za
- Wits University: https://www.wits.ac.za

**What**: Research papers, case notes, commentaries

---

#### B. Legal Blogs & Commentaries
**URLs**:
- Bowmans (law firm): https://bowmanslaw.com
- Cliffe Dekker Hofmeyr: https://www.cdhlegal.com
- Webber Wentzel: https://www.webberwentzel.com
- ENS Africa: https://www.ensafrica.com

**Content**:
- Legal commentaries
- Client updates
- Practice notes
- Case analysis

**Priority**: MEDIUM

---

#### C. Legal Journals & Databases
**Options**:
- Sabinet/Africa-Wide Information (may require subscription)
- ResearchGate legal papers
- SSRN papers on South African law
- Law journals (SALJ, Stellenbosch Law Review, etc.)

**Priority**: MEDIUM (may be limited access)

---

## Tier 3: SUPPLEMENTARY SOURCES

### 6. Model Contracts & Templates

**Where to Find**:
- Law firm websites
- Department of Justice
- Business South Africa
- Government tender documents

**What to Extract**:
- Sale of property agreements
- Service agreements
- Employment contracts
- Lease agreements
- Confidentiality agreements

**For**: Contract law topic improvement

---

### 7. Court Websites
**URLs**:
- Constitutional Court: https://www.concourt.org.za
- Supreme Court of Appeal: https://www.justice.gov.za/sca
- High Courts: https://www.justice.gov.za

**Content**:
- Full judgments
- Cause lists
- Court practice directions
- Court rules

**Priority**: HIGH (overlaps with SAFLII but more current)

---

### 8. Regulatory Authorities
**Key Sources**:

#### Department of Justice
**URL**: https://www.justice.gov.za
**Content**:
- Court rules
- Procedural guidance
- Practice directions
- Court statistics

#### CCMA (Commission for Conciliation, Mediation & Arbitration)
**URL**: https://www.ccma.org.za
**Content**:
- Unfair dismissal awards
- CCMA decisions
- Guidance documents
- Code of Good Practice

**Priority**: HIGH for labor law

#### National Credit Regulator
**URL**: https://www.ncr.org.za
**For**: Consumer credit law (supplementary)

---

## Tier 4: OPTIONAL ENHANCED SOURCES

### 9. Academic Databases (If Available)

**Options**:
- JSTOR (may require subscription)
- ProQuest (may require subscription)
- Google Scholar: https://scholar.google.co.za (free)
- ResearchGate: https://www.researchgate.net

**Content**:
- Peer-reviewed articles
- Legal research
- Case law analysis
- Theoretical discussions

---

### 10. Law Firms Knowledge Bases
**Many firms publish**:
- Practice guides
- Legal commentaries
- Legislation summaries
- Training materials

**Examples**:
- Bowmans
- Cliffe Dekker Hofmeyr
- Webber Wentzel
- Deloitte Legal

---

## Scraping Priority Matrix

### Phase 1: Foundation (Weeks 1-2)
```
CRITICAL - Must complete:
1. SAFLII Labour Court cases (unfair dismissal)
2. Succession Act 1950 (witness requirements)
3. PIE Act 1998 (eviction procedures)
4. Labour Relations Act 1995 (dismissal remedies)
5. Constitution (legal principles)

Expected Impact: +20% overall success
```

### Phase 2: Expansion (Weeks 3-4)
```
HIGH - Should complete:
1. All SAFLII High Court cases
2. Government Gazette regulations
3. Court practice directions
4. CCMA awards and guidance
5. Contract law resources

Expected Impact: +15% overall success
```

### Phase 3: Refinement (Weeks 5-6)
```
MEDIUM - Nice to have:
1. Law firm commentaries
2. Academic papers
3. Legal blog posts
4. Legal journals
5. Case law analysis pieces

Expected Impact: +10% overall success
```

---

## Specific Queries for SAFLII Scraping

```typescript
// Add to firecrawl-ingest.ts

const courtQueries = [
  // Contract Law (currently 25% success)
  { court: "ZAWC", query: "contract interpretation agreement" },
  { court: "ZAGJ", query: "contract law commercial" },
  { court: "ZACC", query: "contract formation validity" },
  
  // Witness & Will (currently 100% success - maintain)
  { court: "ZACC", query: "will testament witness requirements" },
  { court: "ZASCA", query: "succession inheritance will" },
  
  // Dismissal (currently 100% success - expand)
  { court: "ZALC", query: "unfair dismissal remedies" },
  { court: "ZALC", query: "procedural substantive fairness" },
  { court: "ZALAC", query: "dismissal appeal" },
  
  // Eviction (currently 100% success - maintain)
  { court: "ZAWC", query: "eviction PIE Act illegal occupation" },
  { court: "ZAGJ", query: "eviction court order" },
  
  // Succession (currently 100% success - maintain)
  { court: "ZACC", query: "intestate succession dependents" },
  { court: "ZACC", query: "inheritance distribution" },
];
```

---

## Data Quality Standards

### For Each Source, Ensure:
1. **Complete text** - No truncation
2. **Proper chunking** - Logical boundaries
3. **Metadata** - Source, date, court, case number
4. **Legal citations** - Preserved and linked
5. **Formatting** - Clean, consistent

### Validation Checklist:
- ✅ Document count reasonable
- ✅ No duplicate content
- ✅ Text is readable
- ✅ Metadata complete
- ✅ Citations preserved
- ✅ Updates tracked

---

## Implementation Order

```
Week 1:
  Day 1-2: SAFLII Labour Court comprehensive scrape
  Day 3-4: Government Acts (Succession, PIE, LRA)
  Day 5: Constitution and court rules

Week 2:
  Day 1: SAFLII High Courts comprehensive scrape
  Day 2-3: Government Gazette and regulations
  Day 4: CCMA awards and guidance
  Day 5: Contract law resources

Week 3:
  Day 1: Law firm commentaries
  Day 2: Academic papers
  Day 3: Legal blog posts
  Day 4-5: Testing and re-embedding
```

---

## Expected Coverage After Scraping

| Topic | Before | After | Target |
|-------|--------|-------|--------|
| Witness Law | 100% | 100% | 100% |
| Eviction | 100% | 100% | 100% |
| Labor Law | 100% | 100% | 100% |
| Succession | 100% | 100% | 100% |
| Will Execution | 75% | 95% | 95% |
| Contract Law | 25% | 85% | 85% |
| **Overall** | 83.3% | **93%** | **90%+** |

---

## Notes

- SAFLII is the primary source (free, comprehensive)
- Government sources are authoritative (must include)
- Law firm commentaries add practical insight
- Academic sources add theoretical depth
- Regular re-scraping needed for updates (monthly/quarterly)

---

## Resources & Tools

**Already Available**:
- Firecrawl API (included in project)
- Playwright (installed)
- Cheerio (installed)
- LangChain (installed)
- PDF-parse (installed)

**May Need to Add**:
- Apify SDK (optional, for advanced scraping)
- Subscription to academic databases (optional)

---

## Success Metrics

After scraping all Tier 1 sources:
- Contract Law: 75%+ (from 25%)
- Will Execution: 90%+ (from 75%)
- Overall: 90%+ (from 83.3%)
- All topics: 85%+ minimum

---

Ready to start scraping?
