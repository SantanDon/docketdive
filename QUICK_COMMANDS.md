# DocketDive Quick Commands Reference

## Phase 1: Complete ✅

### Tool Removal
- ✅ Removed tool invocation feature
- ✅ Enhanced SAFLII scraper with keywords
- ✅ Created legislation ingestion system

---

## Phase 2: Prepare Legislation ⏳

### Download Acts (Automated)
```bash
# Download Tier 1 acts (critical - 4 acts)
npm run download-legislation

# Download Tier 1 & 2 acts (recommended - 8 acts)
npm run download-legislation -- --tier 2

# Download Tier 1, 2 & 3 acts (all - 10 acts)
npm run download-legislation -- --tier 3
```

### Verify Downloads
```bash
# Check if legislation files are present and valid
npm run verify-legislation
```

### Manual Download
If automated download fails:
1. Visit: https://www.gov.za/documents/acts
2. Download each Act (see PHASE_2_GUIDE.md for list)
3. Save to: `documents/legislation/` folder
4. Use naming: `ActName_Year.pdf`
5. Run: `npm run verify-legislation`

---

## Phase 3: Ingest & Scrape (Ready to Execute)

### Step 1: Ingest Legislation
```bash
npm run ingest-legislation
```
**What it does:**
- Processes PDFs in `documents/legislation/`
- Chunks by legal sections
- Generates embeddings
- Stores in Astra DB

**Duration:** ~5-10 minutes for 4 acts

### Step 2: Scrape Case Law
```bash
npm run scrape-saflii
```
**What it does:**
- Scrapes SAFLII for case law
- Extracts metadata (citation, parties, date)
- Focuses on Labour Court and contract cases
- Stores cases with embeddings

**Duration:** ~30-60 minutes

### Step 3: Re-generate All Embeddings
```bash
npm run reembed-docs
```
**What it does:**
- Re-generates embeddings for ALL documents
- Ensures consistent vector quality
- Necessary after new ingestion

**Duration:** ~10-20 minutes (depending on document count)

---

## Phase 4: Test & Verify (Ready to Execute)

### Test Vector Search
```bash
npm run test:comprehensive
```
**What it tests:**
- Vector search accuracy
- Document retrieval quality
- Metadata extraction

**Expected:** 100% pass rate

### Test LLM Integration
```bash
npm run test:prompts
```
**What it tests:**
- LLM answer generation
- Context awareness
- Answer accuracy across legal topics

**Expected:** >90% success rate

### Manual Testing
```bash
npm run dev
```
Then visit http://localhost:3000 and test queries:
- Labour Law: "What is unfair dismissal?"
- Contract Law: "What is breach of contract?"
- Constitutional: "What are fundamental rights?"

---

## All Ingestion Commands

### Ingest Legislation
```bash
npm run ingest-legislation
```

### Ingest Local Documents
```bash
npm run ingest
```

### Scrape SAFLII (Enhanced)
```bash
npm run scrape-saflii
```

### Scrape Government Acts (Original)
```bash
npm run scrape-acts
```

### Re-embed All Documents
```bash
npm run reembed-docs
```

---

## All Testing Commands

### Comprehensive RAG Test
```bash
npm run test:comprehensive
```

### Multi-Prompt Test
```bash
npm run test:prompts
```

### Quick RAG Test
```bash
npm run test:rag
```

### Playwright E2E Tests
```bash
npm run test:e2e
```

---

## Development

### Start Dev Server
```bash
npm run dev
```
Then visit: http://localhost:3000

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm run start
```

---

## Database Management

### Load Database
```bash
npm run load-db
```

### Clear Database
```bash
npm run clear-db
```

### Search Database
```bash
npm run search-case <query>
```

---

## Diagnostics

### Run RAG Diagnostics
```bash
npm run test:rag-full
```

### Diagnose RAG
```bash
npm run diagnose-rag
```

### Debug Sources
```bash
npm run debug-sources
```

---

## Phase Timeline

| Phase | Status | Key Commands |
|-------|--------|--------------|
| Phase 1 | ✅ Complete | (tool removal, scraper enhancement) |
| Phase 2 | ⏳ Current | `npm run download-legislation` |
| Phase 3 | Ready | `npm run ingest-legislation` + `npm run scrape-saflii` + `npm run reembed-docs` |
| Phase 4 | Ready | `npm run test:comprehensive` + `npm run test:prompts` |

---

## Recommended Execution Order

### Quick Start (Phase 2 → 3)
```bash
# 1. Download acts (automated)
npm run download-legislation

# 2. Verify downloads
npm run verify-legislation

# 3. Ingest legislation
npm run ingest-legislation

# 4. Scrape case law
npm run scrape-saflii

# 5. Re-embed
npm run reembed-docs
```

### Full Pipeline (All Phases)
```bash
# Phase 2: Prepare
npm run download-legislation
npm run verify-legislation

# Phase 3: Ingest & Scrape
npm run ingest-legislation
npm run scrape-saflii
npm run reembed-docs

# Phase 4: Test
npm run test:comprehensive
npm run test:prompts
```

---

## Expected Durations

| Command | Duration | Note |
|---------|----------|------|
| `download-legislation` | 5-10 min | Automated |
| `verify-legislation` | 1 min | Instant check |
| `ingest-legislation` | 5-10 min | 4 acts |
| `scrape-saflii` | 30-60 min | All courts |
| `reembed-docs` | 10-20 min | All documents |
| `test:comprehensive` | 2-5 min | Vector search |
| `test:prompts` | 10-15 min | LLM integration |

**Total time:** ~2-3 hours (mostly automated processing)

---

## Troubleshooting Commands

```bash
# Check if Node.js is installed
node --version

# Check if packages are installed
npm list tsx

# Check legislation folder structure
ls -la documents/legislation/

# Verify legislation files
npm run verify-legislation

# Run full diagnostics
npm run test:rag-full

# Clear and restart (if needed)
npm run clear-db
npm run load-db
```

---

## Documentation Files

| File | Purpose |
|------|---------|
| `PHASE_1_COMPLETE.md` | Phase 1 summary |
| `PHASE_2_GUIDE.md` | Phase 2 detailed guide |
| `NEXT_STEPS.md` | Phases 2-4 overview |
| `SCRAPING_STRATEGY.md` | Legal compliance guidelines |
| `DOWNLOAD_LEGISLATION.md` | Manual download instructions |
| `README_PHASE_1.txt` | Visual summary |

---

## Next Action

**Start with Phase 2:**
```bash
npm run download-legislation
```

Then verify:
```bash
npm run verify-legislation
```

---

*Last Updated: January 4, 2026*  
*Version: 1.0*  
*Status: Ready for Phase 2*
