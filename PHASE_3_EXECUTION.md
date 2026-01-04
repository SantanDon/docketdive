# Phase 3: Ingest & Scrape - Execution Guide

**Status**: Ready to Execute  
**Duration**: 4-6 hours (mostly automated)  
**Outcome**: 2000+ document chunks with embeddings in database

---

## Overview

Phase 3 focuses on ingesting the downloaded legislation and scraping case law. This is the data expansion phase that will improve knowledge base coverage.

---

## Prerequisites

Before starting Phase 3, ensure:

```bash
# 1. Verify legislation is downloaded
npm run verify-legislation

# Expected output: All acts present and validated
```

**Required Files:**
- ✅ Constitution_of_RSA_1996.pdf
- ✅ Labour_Relations_Act_1995.pdf
- ✅ Basic_Conditions_Employment_Act_1997.pdf
- ✅ Bills_of_Exchange_Act_1964.pdf

**Environment:**
- ✅ `.env.local` has GROQ_API_KEY (or your embedding provider)
- ✅ ✅ `.env.local` has ASTRA_DB_* credentials
- ✅ Network connectivity to gov.za, saflii.org, Astra DB
- ✅ At least 2GB free disk space

---

## Phase 3 Step-by-Step

### Step 1: Ingest Legislation (5-10 minutes)

**What it does:**
- Reads all PDFs from `documents/legislation/`
- Extracts text using PDF parser
- Chunks by legal sections (Section 1, Schedule A, etc.)
- Generates embeddings for each chunk
- Stores in Astra DB with rich metadata

```bash
npm run ingest-legislation
```

**Expected Output:**
```
🚀 Starting Legislation Ingestion

📂 Looking for legislation in: documents/legislation
Found 4 legislation files.

📜 Processing: Constitution_of_RSA_1996.pdf
────────────────────────────────────────────────────────────────────────────
   📄 Extracting text from PDF...
   ✅ Extracted 250000 characters
   📋 Act: Constitution of the RSA (1996)
   🏷️  Category: Constitutional Law
   🔀 Created 45 chunks
   💾 Storing 45 chunks...
   ✅ Stored 45/45 chunks

📜 Processing: Labour_Relations_Act_1995.pdf
[... similar output for each act ...]

🏁 Legislation Ingestion Complete!
💾 Total chunks stored: 180
================================================================================
```

**What gets stored:**
- ~40-50 chunks per Act
- Metadata: Act name, year, section number, category
- Embeddings: Vector representation for semantic search
- Source: 'legislation' tracking

**Duration**: 5-10 minutes depending on file sizes

**Troubleshooting:**
```bash
# If fails with "Cannot find module":
npm install

# If fails with "Cannot read PDF":
# Check file is not corrupted
ls -lh documents/legislation/

# If hangs:
# Check API rate limits
# Wait a minute, then try again
```

---

### Step 2: Scrape SAFLII Case Law (30-60 minutes)

**What it does:**
- Scrapes Southern African courts from SAFLII
- Focuses on Labour Court (with enhanced keywords)
- Targets contract law cases in High Courts
- Extracts case metadata (citation, parties, date, judges)
- Stores full judgment text with embeddings

```bash
npm run scrape-saflii
```

**Expected Output:**
```
🚀 Starting SAFLII Case Law Scraper

================================================================================
📚 Scraping Constitutional Court...
────────────────────────────────────────────────────────────────────────────
📋 Fetching case list from /za/cases/ZACC/...
   Found 45 cases
📄 Scraping: Case 1/45
   ✅ Extracted: Case Name v The State [ZACC 2023]
   💾 Storing 8 chunks in database...
   ✅ Stored 8/8 chunks

[... more cases ...]

📚 Scraping Labour Court... (ENHANCED)
────────────────────────────────────────────────────────────────────────────
📋 Fetching case list from /za/cases/ZALC/...
   Found 120 cases
📄 Scraping: Case 1/120 (Labour Law keywords detected)
   ✅ Extracted: Employee v Employer [ZALC 2023]
   💾 Storing 5 chunks...
   ✅ Stored 5/5 chunks

[... more courts ...]

🏁 Scraping Complete!
📊 Total cases scraped: 180
💾 Total chunks stored: 450
================================================================================
```

**Courts Scraped:**
- Constitutional Court (ZACC) - 30-50 cases
- Supreme Court of Appeal (ZASCA) - 20-30 cases
- High Courts (Gauteng, Western Cape, KZN) - 60-80 cases
- **Labour Court (ZALC) - 80-120 cases** (NEW - enhanced)
- Labour Appeal Court (ZALAC) - 20-30 cases

**Total Expected Cases**: 200-300 cases → ~400-500 chunks

**Duration**: 30-60 minutes (respects 2-second rate limiting)

**Monitoring:**
- Watch for progress dots (.)
- Each dot = 1 chunk successfully stored
- No dots = processing case, be patient

**Troubleshooting:**
```bash
# If hangs on a court:
# Ctrl+C to stop, then retry
npm run scrape-saflii

# If network error:
# Check internet connection
# SAFLII may be temporarily unavailable, wait 5 min

# If Astra DB errors:
# Check API credentials
# May have exceeded quota, wait and retry
```

---

### Step 3: Re-generate All Embeddings (10-20 minutes)

**Critical Step**: Must run after any new ingestion

**What it does:**
- Scans database for all documents
- Re-generates embeddings for consistency
- Ensures vector quality across all documents
- Updates any missing embeddings

```bash
npm run reembed-docs
```

**Expected Output:**
```
🚀 Starting Re-embedding Process

📊 Database Statistics:
   Total documents: 630
   Documents with vectors: 600
   Documents needing vectors: 30

🔄 Re-generating embeddings...
   Processing chunk 1/630 .....................
   Processing chunk 100/630 .....................
   Processing chunk 200/630 .....................
   Processing chunk 300/630 .....................
   Processing chunk 400/630 .....................
   Processing chunk 500/630 .....................
   Processing chunk 600/630 .....................

✅ Re-embedding Complete!
📊 Total vectors: 630
⏱️  Duration: 12 minutes
================================================================================
```

**Duration**: 10-20 minutes (depends on total chunks)

**Important Notes:**
- Run this EVERY TIME after ingesting new documents
- Ensures vector consistency across database
- May consume API credits if using external provider
- Can be run during off-peak hours if needed

---

## Complete Phase 3 Workflow

### Quick Execution (All Commands)

```bash
# 1. Ingest legislation (5-10 min)
npm run ingest-legislation

# 2. Scrape case law (30-60 min)
npm run scrape-saflii

# 3. Re-embed everything (10-20 min)
npm run reembed-docs

# 4. Quick sanity check (optional)
npm run verify-legislation
```

**Total Time**: 45-90 minutes (mostly passive)

### With Monitoring

```bash
# 1. Start ingest in one terminal
npm run ingest-legislation

# Wait for completion, then:

# 2. Start scrape in another terminal
npm run scrape-saflii

# Monitor progress (should see dots appearing)
# Meanwhile, read Phase 4 guide in another window

# After scrape completes:

# 3. Re-embed
npm run reembed-docs

# Monitor: Should take 10-20 min
```

---

## What Gets Stored in Database

### Legislation (from Phase 3, Step 1)
```
Document Count: 4 Acts → ~180 chunks
Metadata:
  - Source: 'legislation'
  - Act name & year
  - Section number (if detected)
  - Legal category (Labour, Contract, Constitutional, etc.)
  - Upload date
  - Chunk index (1 of 50, etc.)
```

### Case Law (from Phase 3, Step 2)
```
Document Count: 200-300 cases → ~400-500 chunks
Metadata:
  - Source: 'SAFLII'
  - Citation (e.g., "2023 ZACC 1")
  - Court (e.g., "Constitutional Court")
  - Party names
  - Judges (if extracted)
  - Date of judgment
  - Legal category (Labour Law, Contract Law, etc.)
  - URL link to original
```

### Embeddings (from Phase 3, Step 3)
```
Total Vectors: ~630
Each chunk gets a 1536-dimensional embedding
Vector quality: Consistent across all documents
Search capability: Semantic similarity matching
```

---

## Verification During Phase 3

### Monitor Step 1 (Legislation)
```
Expected:
- 4 files processed
- ~180 chunks total
- ~45 chunks per Act
- 0 errors
```

### Monitor Step 2 (Scraping)
```
Expected:
- 200-300 cases total
- Labour Court: 80-120 cases (with keyword matching)
- High Courts: 60-80 cases
- Constitutional Court: 30-50 cases
- ~400-500 chunks total
- 0 critical errors (warnings OK)
```

### Monitor Step 3 (Re-embedding)
```
Expected:
- 630 total vectors
- All chunks get embeddings
- Duration: 10-20 minutes
- No API errors
```

---

## Troubleshooting Phase 3

### "Module not found: cheerio"
```bash
npm install
npm run ingest-legislation
```

### "PDF extraction fails"
- File may be corrupted
- Re-download from gov.za
- Or skip that file (continue with others)

### "SAFLII scraping hangs"
- Network timeout or SAFLII temporarily down
- Ctrl+C and retry
- Check internet connectivity
- Wait 5 minutes and retry

### "Astra DB API error"
- Check credentials in .env.local
- May have exceeded quota (wait a day)
- Check API rate limits
- Retry after a few minutes

### "Vector generation timeout"
- External API slow or overloaded
- Reduce batch size (edit reembed-docs.ts)
- Run during off-peak hours
- Check API quotas

### "Database quota exceeded"
- Limited free tier quota
- Options:
  1. Wait for quota reset
  2. Upgrade to paid tier
  3. Clear old documents: `npm run clear-db`
  4. Skip Tier 2 Acts (ingest only Tier 1)

---

## Performance Optimization

### For Faster Ingestion

```bash
# Process larger chunks (less API calls)
# Edit CHUNK_SIZE in ingest-legislation.ts
# Increase from 700 to 1000 characters

# Or skip some acts (Tier 2)
# Only ingest Tier 1 acts first
```

### For Faster Scraping

```bash
# Increase rate limit (carefully)
# Edit RATE_LIMIT_MS in safliiScraper.ts
# Increase from 2000 to 1500ms
# (May get blocked if too aggressive)

# Or limit cases per court
# Edit MAX_CASES_PER_COURT to lower number
```

### For Faster Re-embedding

```bash
# Reduce batch size or run during off-peak
# Edit batch processing in reembed-docs.ts
# Process in smaller batches to avoid timeouts
```

---

## After Phase 3 Completes

**Immediate Next**: Phase 4 (Testing)

```bash
# Test vector search accuracy
npm run test:comprehensive

# Test LLM integration
npm run test:prompts
```

**Expected Results**:
- Vector search: 100% pass rate
- LLM answers: >90% success rate
- Labour Law: Improved accuracy (60% → 85%+)
- Contract Law: Significantly improved (25% → 75%+)

---

## Database Impact

### Before Phase 3
- ~500 chunks
- Limited legislation
- Few Labour Court cases
- Poor contract law coverage

### After Phase 3
- ~630 chunks
- 4+ Acts with full text
- 80-120 Labour Court cases
- 50+ Contract law cases from High Courts

### Improvement
- +130 chunks (+26%)
- +400% legislation coverage
- +300% Labour Law cases
- +200% Contract Law cases

---

## Estimated Timeline

| Step | Duration | What Happens |
|------|----------|--------------|
| **1. Ingest** | 5-10 min | PDF processing |
| **2. Scrape** | 30-60 min | Web scraping with delays |
| **3. Re-embed** | 10-20 min | Vector generation |
| **Break** | 10-15 min | Grab coffee ☕ |
| **Ready for Phase 4** | - | Data validated |
| **Phase 4 (Testing)** | 2-3 hours | Test & verify (next) |

**Total Phase 3**: 45-90 minutes active + some passive waiting

---

## Next: Phase 4

After Phase 3 completes successfully, proceed to Phase 4:

```bash
# Read Phase 4 guide
# See: PHASE_4_TESTING.md

# Then run tests
npm run test:comprehensive
npm run test:prompts
```

Expected: 93%+ overall accuracy with Labour Law and Contract Law significantly improved.

---

## Commands Summary

```bash
# Phase 3 Execution
npm run ingest-legislation      # Step 1: Process acts
npm run scrape-saflii           # Step 2: Scrape cases
npm run reembed-docs            # Step 3: Generate vectors

# Monitoring/Verification
npm run verify-legislation      # Check legislation files
npm run test:comprehensive      # Quick data validation (Phase 4)

# Diagnostics
npm run test:rag-full           # Full RAG diagnostics
npm run diagnose-rag            # Detailed diagnostics
```

---

## Document Reference

| Guide | Purpose |
|-------|---------|
| PHASE_2_GUIDE.md | Download legislation |
| PHASE_3_EXECUTION.md | **This guide** - Ingest & scrape |
| PHASE_4_TESTING.md | Test & verify results |
| QUICK_COMMANDS.md | Command reference |
| STATUS_REPORT.md | Project status |

---

**Ready to execute Phase 3?** Start with:
```bash
npm run ingest-legislation
```

---

*Created: January 4, 2026*  
*Status: Ready to Execute*  
*Phase: 3 of 4*
