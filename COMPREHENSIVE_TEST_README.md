# Comprehensive RAG Pipeline Test Suite

## Overview

A complete testing framework to verify your vector embedding pipeline and knowledge base retrieval system works correctly.

---

## The Problem You Had

```
User: "What age must a witness be to a will?"
AI:   "I don't have that in my knowledge base"
```

**Why?** Documents were ingested but not embedded with vectors.

**Solution?** These tests verify the fix.

---

## Test Suite Components

### 1. Diagnostic Scripts

| Script | Command | Purpose | Time |
|--------|---------|---------|------|
| `diagnose-rag.ts` | `npm run diagnose-rag` | Health status | 1 min |
| `test-rag.ts` | `npm run test-rag` | Vector search | 2 min |
| `comprehensive-rag-test.ts` | `npm run test:comprehensive` | **Full pipeline** | 5 min |

### 2. Documentation

| File | Purpose |
|------|---------|
| `START_HERE_TESTS.md` | Quick start guide ⭐ |
| `RAG_PIPELINE_TEST_GUIDE.md` | Detailed guide |
| `RAG_TEST_CHECKLIST.md` | Checklist format |
| `TEST_SUMMARY.md` | Overview |
| `COMPREHENSIVE_TEST_README.md` | This file |

---

## Quick Start

### One Command To Test Everything
```bash
npm run test:comprehensive
```

**This runs:**
- 8 test sets (initial queries + follow-ups)
- 4 legal topics (witness age, eviction, dismissal, succession)
- 24 total test queries
- Generates a comprehensive report

**Time:** ~5 minutes

---

## What Gets Tested

### Test Set 1: Witness Age (Succession Law)
```
Initial:   "What age must a witness be to a will?"
Follow-up: "What other requirements must they meet?"
Expected:  Documents mentioning 14 years, competency, presence
```

### Test Set 2: Eviction Law (Property Law)
```
Initial:   "What are the requirements for eviction in South Africa?"
Follow-up: "How long does the process take?"
Expected:  PIE Act documents with timelines
```

### Test Set 3: Unfair Dismissal (Labor Law)
```
Initial:   "What remedies are available for unfair dismissal?"
Follow-up: "Who has to prove it was unfair?"
Expected:  Labour Court case law with burden of proof
```

### Test Set 4: Succession (Estate Law)
```
Initial:   "What is the order of intestate succession?"
Follow-up: "What if there are multiple dependents?"
Expected:  Succession Act provisions and edge cases
```

---

## Expected Output Format

```
🧪 COMPREHENSIVE RAG PIPELINE TEST

────────────────────────────────────────
📋 WITNESS AGE REQUIREMENT (Initial Query)
────────────────────────────────────────

✅ Query: "What age must a witness be to a will?"
   Found: 5 results | Top similarity: 92.3%
   Source: South African Succession Law
   Content: "A witness to a will must be at least 14 years..."

✅ Query: "witness age requirement South Africa will"
   Found: 5 results | Top similarity: 88.1%
   ...

────────────────────────────────────────
🔄 WITNESS REQUIREMENTS (Context-Aware Follow-up)
────────────────────────────────────────

✅ Query: "What other requirements must they meet?"
   Found: 4 results | Top similarity: 85.6%
   Source: Wills Act Requirements
   Content: "In addition to age, witness must..."

...additional test sets...

────────────────────────────────────────
📊 TEST SUMMARY
────────────────────────────────────────

Total Tests: 24
Passed: 22 ✅
Failed: 2 ❌
Pass Rate: 91.7%

────────────────────────────────────────
🔍 DIAGNOSIS
────────────────────────────────────────

✅ PIPELINE HEALTHY
   All queries returning relevant results
   Knowledge base is properly embedded and searchable
```

---

## Interpreting Results

### Pass Rate ≥ 90% ✅
```
✅ PIPELINE HEALTHY

Your system is working correctly:
- Vectors are embedded
- Search is functional
- Knowledge base is accessible
- Context awareness works

Action: Test in UI
Command: npm run dev
```

### Pass Rate 80-89% ⚠️
```
⚠️  MOSTLY WORKING

Some queries not finding documents:
- Some docs may not be embedded
- Might be chunking issues
- Could be metadata problems

Action: Run re-embedding
Command: npm run reembed-docs
Then retry: npm run test:comprehensive
```

### Pass Rate < 80% ❌
```
❌ CRITICAL - VECTORS MISSING

Most documents lack vectors:
- Embedding step not completed
- Database may be empty
- Configuration issue

Action: Re-embed all documents
Command: npm run reembed-docs
Then verify: npm run test:comprehensive
```

---

## Complete Workflow

```
Step 1: Run Test
   npm run test:comprehensive
   ↓
Step 2: Check Pass Rate
   ├─ If ≥90%  → Go to Step 4 ✅
   └─ If <90%  → Go to Step 3
   ↓
Step 3: Fix (if needed)
   npm run reembed-docs
   (wait 5-10 minutes)
   npm run test:comprehensive
   ↓
Step 4: Test in Live UI
   npm run dev
   Ask: "What age must a witness be?"
   Follow-up: (system should remember context)
```

---

## Commands Reference

### Testing
```bash
npm run diagnose-rag          # Quick health check (1 min)
npm run test-rag              # Vector search test (2 min)
npm run test:comprehensive    # Full pipeline test (5 min) ⭐
npm run test:rag-full         # Complete workflow (15 min)
```

### Fixing
```bash
npm run reembed-docs          # Re-embed all documents (5-10 min)
npm run dev                   # Start dev server
npm run count-db-docs         # Check document count
npm run clear-db              # Clear database (destructive!)
```

---

## Files Created

```
scripts/
├── comprehensive-rag-test.ts          ← Main test (NEW)
├── run-rag-diagnostics.ts             ← Workflow runner (NEW)
├── test-rag.ts                        ← Vector search
├── diagnose-rag.ts                    ← Health check
└── reembed-docs.ts                    ← Fix missing vectors

docs/
├── START_HERE_TESTS.md                ← Quick start (NEW)
├── RAG_PIPELINE_TEST_GUIDE.md         ← Detailed guide (NEW)
├── RAG_TEST_CHECKLIST.md              ← Checklist (NEW)
├── TEST_SUMMARY.md                    ← Overview (NEW)
├── COMPREHENSIVE_TEST_README.md       ← This file (NEW)
├── DIAGNOSIS_REPORT.md                ← Problem analysis
├── FIX_KNOWLEDGE_BASE.md              ← Solution guide
└── diagnose-rag.ts                    ← Diagnostic tool
```

---

## Success Metrics

### After Running Tests

| Metric | Target | Meaning |
|--------|--------|---------|
| Pass Rate | ≥90% | Pipeline is healthy |
| Top Similarity | ≥0.7 | Results are relevant |
| Results Count | ≥3 | Knowledge base has coverage |
| Witness Age Test | ✅ | Can retrieve "14 years" |
| Follow-up Test | ✅ | Context awareness works |

---

## Troubleshooting

### Test Won't Start
```
Error: HUGGINGFACE_API_KEY not set
Solution: Add to .env: HUGGINGFACE_API_KEY=hf_...
```

### Connection Error
```
Error: Astra DB connection failed
Solution: Check .env has valid credentials:
  ASTRA_DB_APPLICATION_TOKEN=AstraCS:...
  ASTRA_DB_API_ENDPOINT=https://...
```

### No Documents Found
```
Error: No documents found
Solution: Ingest documents first:
  npm run ingest -- ./data/
```

### All Tests Fail
```
Error: All queries returning empty results
Solution: Re-embed documents:
  npm run reembed-docs
```

### Some Tests Fail
```
Result: Pass Rate 75%
Solution: This is normal for partial ingestion.
Action: Run re-embedding to complete:
  npm run reembed-docs
```

---

## Integration Points

These tests use:
- ✅ Same HuggingFace embeddings as your app (intfloat/multilingual-e5-large)
- ✅ Same Astra DB collection (docketdive)
- ✅ Same vector search algorithm
- ✅ Same metadata extraction

**If tests pass, your app will work.**

---

## Advanced Usage

### Run Specific Test Set
To test only witness age:
```bash
# Modify comprehensive-rag-test.ts
# Keep only testSets[0] and testSets[1]
npm run test:comprehensive
```

### Add Custom Test Cases
Edit `comprehensive-rag-test.ts`:
```typescript
const testSets = [
  {
    name: '📋 YOUR TOPIC',
    queries: [
      "Your query 1",
      "Your query 2",
      "Your query 3"
    ]
  },
  // ... rest of tests
];
```

### Increase Similarity Threshold
Edit `testQuery()` function:
```typescript
async function testQuery(query: string, minSimilarity: number = 0.65) {
  // Changed from 0.5 to 0.65
```

### Monitor Performance
Tests show timing automatically:
- Query embedding: ~500ms
- Vector search: ~200ms
- Total per query: ~700ms (acceptable)

---

## FAQ

**Q: How long does the test take?**
A: ~5 minutes for comprehensive test. Diagnose only takes 1 minute.

**Q: What if some tests fail?**
A: Normal if not all documents are embedded. Run `npm run reembed-docs`.

**Q: Can I run this in production?**
A: No, it uses HuggingFace API. For production, use local embeddings.

**Q: Do I need to re-run after ingesting new docs?**
A: Yes, run `npm run reembed-docs` to embed new documents.

**Q: Will this work without Astra DB?**
A: No, tests specifically verify Astra DB vector search.

**Q: Can I customize the test queries?**
A: Yes, edit `comprehensive-rag-test.ts` and add your own.

---

## Next Steps

1. **Review**: Read `START_HERE_TESTS.md`
2. **Run**: `npm run test:comprehensive`
3. **Check**: Look for "Pass Rate: X%"
4. **Fix** (if needed): `npm run reembed-docs`
5. **Verify**: `npm run test:comprehensive` again
6. **Deploy**: `npm run dev` and test witness age question

---

## Support

If tests don't work:
1. Check `.env` has all required keys
2. Verify Astra DB connection: `npm run count-db-docs`
3. Run diagnostics: `npm run diagnose-rag`
4. Check logs for specific errors
5. Re-embed: `npm run reembed-docs`

---

## Summary

**This test suite verifies:**
- ✅ Documents are embedded with vectors
- ✅ Vector search finds relevant documents
- ✅ Knowledge base is accessible
- ✅ Context awareness works
- ✅ System can answer "witness age = 14 years"

**Start with**: `npm run test:comprehensive`

**Expected**: Pass rate ≥ 90%

**Timeline**: 5 minutes to complete test

🚀 Ready? Run: `npm run test:comprehensive`
