# DocketDive Phase 2-4: Next Steps

## 🚀 Quick Start

Phase 1 (Tool removal + Scraper enhancement) is complete. Here's what to do next:

---

## Phase 2: Prepare Legislation Documents (2-3 hours)

### Step 1: Create Folder
```bash
mkdir -p documents/legislation
```

### Step 2: Download Key Acts from Gov.za

Visit: **https://www.gov.za/documents/acts**

**Search and download these (Tier 1 - Critical):**

1. **Constitution of the RSA (1996)**
   - Save as: `Constitution_of_RSA_1996.pdf`
   - Link: https://www.gov.za/documents/constitution-republic-south-africa-1996-act-108-1996

2. **Labour Relations Act (1995)**
   - Save as: `Labour_Relations_Act_1995.pdf`
   - Link: https://www.gov.za/documents/labour-relations-act-1995

3. **Basic Conditions of Employment Act (1997)**
   - Save as: `Basic_Conditions_Employment_Act_1997.pdf`
   - Link: https://www.gov.za/documents/basic-conditions-employment-act-1997

4. **Bills of Exchange Act (1964)**
   - Save as: `Bills_of_Exchange_Act_1964.pdf`
   - Link: https://www.gov.za/documents/bills-exchange-act-1964

### Step 3: Verify Downloads
```bash
# Check your documents/legislation folder contains:
ls -la documents/legislation/

# Should show:
# Constitution_of_RSA_1996.pdf
# Labour_Relations_Act_1995.pdf
# Basic_Conditions_Employment_Act_1997.pdf
# Bills_of_Exchange_Act_1964.pdf
```

---

## Phase 3: Run Ingestion & Scraping (4-6 hours)

### Step 1: Ingest Legislation
```bash
npm run ingest-legislation
```

**Expected Output:**
- Extracts text from each PDF
- Chunks by legal sections
- Generates embeddings
- Stores in Astra DB
- Should take ~5-10 minutes for Tier 1 Acts

### Step 2: Scrape SAFLII (Enhanced with Labour Law focus)
```bash
npm run scrape-saflii
```

**Expected Output:**
- Scrapes Constitutional Court (ZACC)
- Scrapes Supreme Court of Appeal (ZASCA)
- Scrapes High Courts (ZAGPPHC, ZAWCHC, ZAKZPHC)
- **NEW**: Scrapes Labour Court (ZALC) with Labour Law keyword filtering
- **NEW**: Better Contract Law detection in all courts
- Should target 100+ Labour Court cases
- May take 30-60 minutes depending on internet

### Step 3: Ingest Local Documents
```bash
npm run ingest
```

**This ingests any PDFs/DOCs in `documents/` folder not yet in DB**

### Step 4: Re-Generate All Embeddings
```bash
npm run reembed-docs
```

**Important**: Run this AFTER all new documents are ingested
- Re-generates vectors for all documents
- Ensures consistent embedding quality
- Takes 10-20 minutes depending on document count
- May cost API credits if using external embedding service

---

## Phase 4: Test & Verify (2-3 hours)

### Step 1: Run Comprehensive Vector Search Test
```bash
npm run test:comprehensive
```

**What it tests:**
- Vector search accuracy
- Retrieval quality
- Metadata extraction

**Expected Result:**
- ✅ 100% pass rate (baseline)
- If <100%, indicates ingestion or embedding issues

### Step 2: Run Multi-Prompt LLM Integration Test
```bash
npm run test:prompts
```

**What it tests:**
- LLM integration
- Context awareness
- Answer accuracy across different legal topics

**Expected Result:**
- ✅ >90% success rate (improved from 83.3%)
- Labour Law: 60% → 85%+
- Contract Law: 25% → 75%+
- Constitutional Law: 80% → 90%+

### Step 3: Manual Spot-Check (Optional)

Start the dev server and manually test:

```bash
npm run dev
```

Then visit http://localhost:3000 and test questions like:

**Labour Law (should now be better):**
- "What constitutes unfair dismissal in South Africa?"
- "What are the requirements for a valid employment contract?"
- "What is a restraint of trade clause?"

**Contract Law (should significantly improve):**
- "What are the requirements for a valid contract?"
- "What is the difference between novation and rescission?"
- "What are the remedies for breach of contract?"

**Constitutional Law (should remain strong):**
- "What is the Bill of Rights?"
- "What are fundamental rights in South Africa?"

---

## Important Notes

### Naming Convention for Legislation
Files must follow this format: `ActName_Year.pdf`

Examples:
```
✅ Constitution_of_RSA_1996.pdf
✅ Labour_Relations_Act_1995.pdf
✅ Bills_of_Exchange_Act_1964.pdf
❌ Constitution 1996.pdf (spaces, missing year)
❌ lra.pdf (unclear, no year)
```

### API Rate Limits
- **Embedding API**: ~10-20 requests/second (check your provider)
- **SAFLII Scraping**: 2 seconds between requests (built-in)
- **Gov.za**: Respectful scraping (no aggressive rate)

### Database Limits
- Astra DB Vector Store: Check quota before large ingestions
- Chunks: Each document becomes multiple chunks (700-char chunks)
- Vectors: ~1500-2000 vectors expected after Phase 3

---

## Troubleshooting

### Ingestion Fails
```bash
# Check if documents/legislation folder exists
ls -la documents/legislation/

# If empty, download PDFs first (Phase 2, Step 2)

# If PDFs exist, check file sizes (should be >100KB)
ls -lh documents/legislation/
```

### Embedding Failures
```bash
# Check API credentials in .env.local
cat .env.local | grep EMBEDDING

# If using external API, verify:
# - GROQ_API_KEY is set
# - API quota not exceeded
# - Network connectivity
```

### Test Failures
```bash
# Run comprehensive test first (diagnoses data layer)
npm run test:comprehensive

# If it passes but prompts test fails:
# - Issue is with LLM integration
# - Check GROQ_API_KEY
# - Check conversation context

# If comprehensive test fails:
# - Issue is with vector search
# - Check embeddings were generated
# - Run reembed-docs again
```

### Slow Performance
```bash
# Large PDFs slow down extraction
# Solution: Process in smaller batches

# If reembed-docs is slow:
# - Check API rate limits
# - Reduce batch size in reembed-docs.ts
# - Run during off-peak hours
```

---

## File Checklist

After completing all phases, you should have:

```
documents/
├── legislation/
│   ├── Constitution_of_RSA_1996.pdf ✅
│   ├── Labour_Relations_Act_1995.pdf ✅
│   ├── Basic_Conditions_Employment_Act_1997.pdf ✅
│   ├── Bills_of_Exchange_Act_1964.pdf ✅
│   └── [optional: more Acts]

app/context/
└── ChatContext.tsx (✅ No tool-detector import)

components/
└── ChatBubble.tsx (✅ No ToolInvocationCard)

scripts/
├── safliiScraper.ts (✅ Enhanced with keywords)
├── ingest-legislation.ts (✅ New)
└── reembed-docs.ts (existing)
```

---

## Success Indicators

### After Phase 2:
- ✅ `documents/legislation/` contains 4+ Act PDFs
- ✅ Files named correctly (Act_Year.pdf format)

### After Phase 3:
- ✅ Ingestion completes without errors
- ✅ 100+ Labour Court cases scraped from SAFLII
- ✅ Embeddings regenerated
- ✅ ~2000+ total chunks in database

### After Phase 4:
- ✅ `npm run test:comprehensive` returns 100% pass
- ✅ `npm run test:prompts` returns >90% pass
- ✅ Contract Law accuracy improved (25% → 75%+)
- ✅ Labour Law accuracy improved (60% → 85%+)

---

## Timeline Estimate

| Phase | Task | Duration | Status |
|-------|------|----------|--------|
| 2 | Download Legislation | 1-2 hours | Start here ➡️ |
| 3 | Ingest + Scrape | 3-4 hours | After Phase 2 |
| 3 | Re-embed | 10-20 min | After ingestion |
| 4 | Test | 1-2 hours | Final verification |

**Total**: 5-8 hours of active work + ~30-40 min of automated processing

---

## Need Help?

- **Scraping fails**: Check `SCRAPING_STRATEGY.md`
- **Ingestion fails**: Check `DOWNLOAD_LEGISLATION.md`
- **Tests fail**: Check test output, run with `--verbose` flag
- **Performance issues**: Check API rate limits and quotas

---

**Ready to start?** Begin with Phase 2 by downloading the Acts! 🚀
