# 🚀 RUN TESTS NOW

## Your Issue
You asked the system a question and it said it didn't have it in the knowledge base. It should have.

**The reason**: Vector embeddings are missing.

**The solution**: Run comprehensive tests to verify and fix it.

---

## One Command

```bash
npm run test:comprehensive
```

**That's it.** This single command will:

1. Test 24 different queries
2. Check 4 legal topics (witness age, eviction, dismissal, succession)
3. Test initial queries + follow-ups
4. Generate a health report
5. Tell you if the system is working

**Time**: About 5 minutes

---

## What You'll See

As the test runs:

```
✅ Query: "What age must a witness be to a will?"
   Found: 5 results | Top similarity: 92.3%
   
✅ Query: "witness age requirement South Africa will"
   Found: 5 results | Top similarity: 88.1%
   
✅ Query: "What other requirements must they meet?"
   Found: 4 results | Top similarity: 85.6%
   
...24 total tests...

📊 RESULTS:
Total Tests: 24
Passed: 22 ✅
Failed: 2 ❌
Pass Rate: 91.7%

✅ PIPELINE HEALTHY
```

---

## What It Means

### Pass Rate ≥ 90% ✅
```
Your system is working!

The witness age query will return:
"A witness must be at least 14 years old"

Follow-up questions will work with context.
```

### Pass Rate 80-89% ⚠️
```
Mostly working, but could be better.

Run this to fix:
npm run reembed-docs

Then test again:
npm run test:comprehensive
```

### Pass Rate < 80% ❌
```
Needs fixing.

Run this:
npm run reembed-docs

Wait 5-10 minutes, then:
npm run test:comprehensive
```

---

## Right Now

### Step 1: Run Test
```bash
npm run test:comprehensive
```

Go grab coffee ☕ - it takes ~5 minutes

### Step 2: Check Results
Look for: **"Pass Rate: X%"**

### Step 3: Act on Results

**If ≥ 90%**: ✅ You're done! Test in the UI:
```bash
npm run dev
# Ask: "What age must a witness be?"
# Should get: "14 years"
```

**If < 90%**: ⚠️ Run the fix:
```bash
npm run reembed-docs
# Wait 5-10 minutes
npm run test:comprehensive
```

---

## Test Structure

The test checks these 8 scenarios:

1. **Witness Age** - Initial query for 14-year requirement
2. **Witness Follow-up** - Context-aware follow-up questions
3. **Eviction Law** - Initial query for eviction requirements
4. **Eviction Follow-up** - Context-aware timelines
5. **Unfair Dismissal** - Initial query for remedies
6. **Dismissal Follow-up** - Context-aware burden of proof
7. **Succession Law** - Initial query for intestate order
8. **Succession Follow-up** - Context-aware dependent scenarios

**Total**: 24 queries across 4 legal topics

---

## Files Created

### Test Scripts
- `scripts/comprehensive-rag-test.ts` - Main test (24 cases)
- `scripts/run-rag-diagnostics.ts` - Full workflow

### Documentation
- `START_HERE_TESTS.md` - Quick start ⭐ READ THIS
- `RAG_PIPELINE_TEST_GUIDE.md` - Detailed guide
- `RAG_TEST_CHECKLIST.md` - Checklist format
- `TEST_SUMMARY.md` - Overview
- `COMPREHENSIVE_TEST_README.md` - Full reference
- `TESTS_CREATED.md` - What was created

### Updated
- `package.json` - Added new test commands

---

## New Commands

```bash
# Quick diagnosis (1 min)
npm run diagnose-rag

# Vector search test (2 min)
npm run test-rag

# Comprehensive test (5 min) ⭐ THIS ONE
npm run test:comprehensive

# Full workflow (15 min)
npm run test:rag-full

# Fix if needed (5-10 min)
npm run reembed-docs

# Test in UI
npm run dev
```

---

## Quick Flowchart

```
Run test:comprehensive
        ↓
   Check Pass Rate
        ↓
   ┌─────┴─────┐
   ↓           ↓
 ≥90%        <90%
   ↓           ↓
  ✅         ❌
Done!    Run reembed-docs
         (5-10 min)
         Retest
```

---

## Success Criteria

After running the test, you want to see:

```
✅ Pass Rate: 90%+
✅ Witness age test: PASS
✅ Follow-up test: PASS
✅ All 4 topics: PASS
✅ Diagnosis: PIPELINE HEALTHY
```

---

## Example Pass Output

```
🧪 COMPREHENSIVE RAG PIPELINE TEST
════════════════════════════════════════

✅ Query: "What age must a witness be to a will?"
   Found: 5 results | Similarity: 92.3%
   
✅ Query: "What other requirements must they meet?"
   Found: 4 results | Similarity: 85.6%

[...more test results...]

────────────────────────────────────────
📊 TEST SUMMARY
────────────────────────────────────────
Total Tests: 24
Passed: 22 ✅
Failed: 2 ❌
Pass Rate: 91.7%

✅ PIPELINE HEALTHY
   All queries returning relevant results
   Knowledge base is properly embedded
```

---

## What to Do If It Fails

### All Tests Return "No Results"
```bash
npm run reembed-docs
# Wait 5-10 minutes
npm run test:comprehensive
```

### Connection Error
```
Check .env file has:
HUGGINGFACE_API_KEY=hf_...
ASTRA_DB_APPLICATION_TOKEN=AstraCS:...
ASTRA_DB_API_ENDPOINT=https://...
```

### Low Pass Rate
```bash
npm run diagnose-rag  # Check health
npm run reembed-docs  # Re-embed everything
npm run test:comprehensive  # Retest
```

---

## The Big Picture

**The Problem**: 
Documents are in the database but not embedded with vectors.

**What Tests Verify**:
✅ Vectors exist
✅ Vector search works
✅ Knowledge base is accessible
✅ Context awareness functions
✅ Witness age query returns "14 years"

**If Tests Pass**:
Your system works!

**If Tests Fail**:
Run re-embed and try again.

---

## Timeline

| Action | Command | Time |
|--------|---------|------|
| Run test | `npm run test:comprehensive` | 5 min |
| Check results | Look at output | 1 min |
| Fix (if needed) | `npm run reembed-docs` | 5-10 min |
| Verify | `npm run test:comprehensive` | 5 min |
| Test in UI | `npm run dev` | ongoing |

**Total worst case**: ~25 minutes

---

## Get Started

```bash
npm run test:comprehensive
```

Then check the output for:

```
Pass Rate: _____%

Diagnosis: ____
```

Report back with those two numbers and I'll help if needed.

---

## Reference

**For quick start**: See `START_HERE_TESTS.md`

**For detailed guide**: See `RAG_PIPELINE_TEST_GUIDE.md`

**For checklist**: See `RAG_TEST_CHECKLIST.md`

---

## That's It

One command to verify your entire RAG pipeline:

```bash
npm run test:comprehensive
```

Takes ~5 minutes.

Shows you if everything is working.

🚀 Go!
