# 🚀 START HERE: Comprehensive RAG Pipeline Tests

## Your Problem Recap

You asked: **"What age must a witness be?"**

System responded: **"Not in knowledge base"**

**Root Cause**: Documents are ingested but vectors are missing.

**Solution**: Run comprehensive tests to verify and fix the pipeline.

---

## One Command To Rule Them All

```bash
npm run test:comprehensive
```

This single command:
- Tests witness age retrieval ✅
- Tests follow-up questions ✅
- Tests 4 legal topics (24 queries)
- Generates a detailed report
- Takes ~5 minutes

---

## What Happens

### During Test
```
🧪 COMPREHENSIVE RAG PIPELINE TEST

Testing: Witness Age Requirement
  ✅ Query: "What age must a witness be to a will?"
     Found: 5 results | Top similarity: 92.3%
     Source: South African Succession Law Document
     
  ✅ Query: "witness age requirement South Africa will"
     Found: 5 results | Top similarity: 88.1%
     
  ❌ Query: "14 years old witness testament"
     Found: 0 results | Similarity below threshold
     
Testing: Follow-up Context
  ✅ Query: "What other requirements must they meet?"
     Found: 4 results | Top similarity: 85.6%
     
...continues for 24 total tests...
```

### After Test
```
📊 TEST SUMMARY
Total Tests: 24
Passed: 22 ✅
Failed: 2 ❌
Pass Rate: 91.7%

✅ PIPELINE HEALTHY
   All queries returning relevant results
```

---

## Three Levels of Testing

### Level 1: Health Check (1 minute)
```bash
npm run diagnose-rag
```
**Checks**: Vector dimensions, document count, keyword search
**Use when**: Want quick status

### Level 2: Vector Search (2 minutes)
```bash
npm run test-rag
```
**Checks**: Can we find documents? Similarity scores?
**Use when**: Want to verify core search works

### Level 3: Full Pipeline (5 minutes) ⭐ RECOMMENDED
```bash
npm run test:comprehensive
```
**Checks**: Everything - initial queries, follow-ups, context, all topics
**Use when**: Want complete verification

---

## What to Expect

### If Pass Rate = 100% ✅
```
✅ PIPELINE HEALTHY
Your system is working perfectly.
Proceed to test in UI.
```

**Test in UI**:
```bash
npm run dev
# Visit http://localhost:3000
# Ask: "What age must a witness be?"
# Should get: "14 years old"
# Ask follow-up: System remembers context
```

### If Pass Rate = 80-99% ⚠️
```
⚠️  MOSTLY WORKING
Some documents may not be embedded.

FIX:
npm run reembed-docs
```
Then retest:
```bash
npm run test:comprehensive
```

### If Pass Rate < 80% ❌
```
❌ CRITICAL - VECTORS MISSING
Most documents lack vector embeddings.

FIX (runs automatically):
npm run reembed-docs

Then verify:
npm run test:comprehensive
```

---

## The Test Flow

```
┌─────────────────────────────────────┐
│  npm run test:comprehensive         │
└──────────────┬──────────────────────┘
               │
               ├─ Check Witness Age Tests (3 queries)
               ├─ Check Witness Follow-up (3 queries)
               ├─ Check Eviction Law (3 queries)
               ├─ Check Eviction Follow-up (3 queries)
               ├─ Check Dismissal Law (3 queries)
               ├─ Check Dismissal Follow-up (3 queries)
               ├─ Check Succession Law (3 queries)
               └─ Check Succession Follow-up (3 queries)
                  = 24 total tests
                  
               │
               ▼
        ┌──────────────────┐
        │ Calculate Score  │
        │ Pass Rate = X%   │
        └────────┬─────────┘
                 │
      ┌──────────┴──────────┐
      │                     │
    ≥90%                  <90%
      │                     │
      ▼                     ▼
   ✅ Success           ❌ Need to fix
                        npm run reembed-docs
```

---

## Example Output

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
   Content: "In addition to age, a witness must be..."

✅ Query: "witness presence requirements will making"
   Found: 5 results | Top similarity: 83.2%
   ...

...more tests...

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

## Quick Start Workflow

### Step 1: Run Test (5 min)
```bash
npm run test:comprehensive
```

### Step 2: Check Results
Look for: `Pass Rate: X%`
- If ≥ 90%: Go to Step 4 ✅
- If < 90%: Go to Step 3

### Step 3: Fix (if needed)
```bash
npm run reembed-docs
```
Wait 5-10 minutes, then:
```bash
npm run test:comprehensive
```

### Step 4: Test in UI
```bash
npm run dev
```
Visit http://localhost:3000
- Ask: "What age must a witness be?"
- Expected: Gets "14 years" from knowledge base
- Ask follow-up: System remembers context

---

## What Gets Tested

### 1. Witness Age (Succession Law)
- Initial: "What age must a witness be to a will?"
- Follow-up: "What other requirements must they meet?"
- Expects: Document about 14-year age requirement

### 2. Eviction (Property Law)
- Initial: "What are the requirements for eviction?"
- Follow-up: "How long does the process take?"
- Expects: PIE Act documents with timelines

### 3. Unfair Dismissal (Labor Law)
- Initial: "What remedies are available?"
- Follow-up: "Who has to prove it was unfair?"
- Expects: Labour Court case law

### 4. Succession (Estate Law)
- Initial: "What is the order of intestate succession?"
- Follow-up: "What if there are multiple dependents?"
- Expects: Succession Act provisions

---

## Files Reference

| File | Purpose |
|------|---------|
| `comprehensive-rag-test.ts` | Main test script (24 cases) |
| `RAG_PIPELINE_TEST_GUIDE.md` | Detailed explanation |
| `RAG_TEST_CHECKLIST.md` | Quick checklist |
| `TEST_SUMMARY.md` | Overview |
| `DIAGNOSIS_REPORT.md` | Why the problem exists |
| `FIX_KNOWLEDGE_BASE.md` | How to fix it |

---

## Success Criteria

### ✅ You'll Know It's Fixed When:
```
1. npm run test:comprehensive shows Pass Rate ≥ 90%
2. Witness age test returns "14 years"
3. Follow-up questions find related documents
4. npm run dev → ask witness age → gets answer
5. Follow-up in UI also gets context-aware answer
```

### 🔴 You'll Know It Needs Fixing When:
```
1. Pass Rate < 90%
2. Many "No relevant results" errors
3. Witness age test returns empty
4. npm run diagnose-rag shows "No vectors"
5. Health score < 80%
```

---

## Commands Cheat Sheet

```bash
# Quick test
npm run diagnose-rag                    # 1 min health check

# Vector search test
npm run test-rag                        # 2 min search test

# Full comprehensive test ⭐
npm run test:comprehensive              # 5 min full pipeline

# Fix if needed
npm run reembed-docs                    # 5-10 min re-embed

# Test in UI
npm run dev                             # Start dev server

# Check database
npm run count-db-docs                   # How many docs
npm run check-db                        # What's in DB
```

---

## Estimated Timeline

| Step | Command | Time | Success |
|------|---------|------|---------|
| Diagnose | `npm run diagnose-rag` | 1 min | Health ≥ 80% |
| Test | `npm run test:comprehensive` | 5 min | Pass ≥ 90% |
| Fix | `npm run reembed-docs` | 5-10 min | (if needed) |
| UI Test | Ask witness age | 1 min | Gets "14 years" |
| **Total** | | **7-17 min** | Complete |

---

## Still Have Issues?

**If test won't start**:
```bash
# Check env
echo $HUGGINGFACE_API_KEY
echo $ASTRA_DB_APPLICATION_TOKEN

# Should not be empty
```

**If tests timeout**:
- Wait for HuggingFace API
- Check network connection

**If all tests fail**:
```bash
# Check database connection
npm run count-db-docs

# Check vectors exist
npm run diagnose-rag
```

**If pass rate is low**:
```bash
# Re-embed documents
npm run reembed-docs

# Wait ~10 minutes, then retest
npm run test:comprehensive
```

---

## Next Steps

1. **Right now**: `npm run test:comprehensive`
2. **Check output**: Look for Pass Rate percentage
3. **If ≥90%**: You're good! Test in UI
4. **If <90%**: Run `npm run reembed-docs` then retest

---

## Bottom Line

This test suite proves your knowledge base is:
- ✅ Properly embedded with vectors
- ✅ Searchable and retrievable
- ✅ Context-aware for follow-ups
- ✅ Comprehensive across legal topics

**Ready to start?**

```bash
npm run test:comprehensive
```

🚀 Go!
