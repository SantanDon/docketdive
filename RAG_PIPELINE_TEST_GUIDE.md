# RAG Pipeline Comprehensive Test Guide

## Quick Start

Run all diagnostics and tests in one command:

```bash
npm run test:comprehensive
```

---

## Problem Statement

You asked questions about:
- **Initial Query**: "witness age requirement"
- **Follow-up**: "what else must they meet?"

The system said it didn't have this in its knowledge base, but **it should**.

**Root Cause**: Documents are ingested but **not embedded with vectors**.

---

## Test Suite Breakdown

### 1️⃣ **Diagnostic Check** (1 minute)
```bash
npm run diagnose-rag
```

**What it checks**:
- ✅ Astra DB connection
- ✅ Document count
- ✅ Vector dimensions (should be 1024)
- ✅ Keyword search ("witness", "age", "14")
- ✅ Document metadata

**Expected Output**:
```
✅ Vector Dimensions
   Correct dimensions: 1024
✅ Keyword Search  
   Found 5/5 keywords
🏥 Overall Health: 100%
```

If health is below 80%, you need to re-embed.

---

### 2️⃣ **Vector Search Test** (2 minutes)
```bash
npm run test-rag
```

**What it tests**:
- Generates query embeddings
- Searches vector database
- Returns top 5 similar documents
- Shows similarity scores

**Sample Queries**:
- "What are the constitutional requirements for eviction?"
- "Labour court unfair dismissal remedies"
- "Constitutional Court interpretation of property rights"

**Expected**:
```
Found 5 relevant documents:
[1] Similarity: 87.5%
    Court: South African Constitutional Court
    Content: "In South African law, eviction requires..."
```

---

### 3️⃣ **Comprehensive Pipeline Test** (5 minutes) ⭐
```bash
npm run test:comprehensive
```

**This is the MAIN test**. Tests everything:

#### Initial Queries (Should Find Knowledge Base)
```
📋 WITNESS AGE REQUIREMENT
  ✅ "What age must a witness be to a will?"
  ✅ "witness age requirement South Africa will"
  ✅ "14 years old witness testament"
```

#### Follow-up Questions (Context-Aware)
```
🔄 WITNESS REQUIREMENTS (Follow-up)
  ✅ "What other requirements must they meet?"
  ✅ "witness presence requirements will making"
  ✅ "witness competency testator presence"
```

#### Other Test Cases
- Eviction law (initial + follow-up)
- Unfair dismissal (initial + follow-up)
- Succession law (initial + follow-up)

**Output Shows**:
- ✅/❌ for each query
- Similarity score
- Source document
- Content preview

**Success Criteria**:
```
Total Tests: 24
Passed: 22 ✅
Failed: 2 ❌
Pass Rate: 91.7%
```

---

## Test Results Interpretation

### If Pass Rate = 100% ✅
```
✅ PIPELINE HEALTHY
   All queries returning relevant results
   Knowledge base is properly embedded and searchable
```

### If Pass Rate = 80-99% ⚠️
```
⚠️  PIPELINE MOSTLY WORKING
   Some queries not finding relevant documents
   → Check if all documents are embedded
   → Run: npm run reembed-docs
```

### If Pass Rate = 50-79% ❌
```
❌ PIPELINE PARTIALLY BROKEN
   Many queries failing
   → Vector embeddings may be missing
   → Run: npm run diagnose-rag
   → Then: npm run reembed-docs
```

### If Pass Rate < 50% 🔴
```
🔴 PIPELINE BROKEN
   Most queries failing - vectors not embedded
   CRITICAL FIX:
   1. npm run diagnose-rag
   2. npm run reembed-docs
   3. npm run test:comprehensive
```

---

## Fix Procedure (If Tests Fail)

### Step 1: Verify Diagnostics
```bash
npm run diagnose-rag
```

Look for:
- "Overall Health: 40%" → CRITICAL - needs embedding
- "No vectors in documents" → CRITICAL - needs embedding
- "Vector Dimensions: ❌" → Check embedding model

### Step 2: Re-embed Documents
```bash
npm run reembed-docs
```

This will:
- Fetch all documents from Astra DB
- Generate HuggingFace embeddings (1024-dim)
- Store vectors in `$vector` field
- Preserve all metadata

**Time**: 2-10 minutes (depends on document count)

### Step 3: Verify Fix
```bash
npm run diagnose-rag
```

Should now show:
```
✅ Vector Dimensions
   Correct dimensions: 1024
✅ Keyword Search
   Found witness, age, 14, will, testament
🏥 Overall Health: 100%
```

### Step 4: Run Full Test Suite
```bash
npm run test:comprehensive
```

Should now show:
```
Pass Rate: 90%+ ✅
Diagnosis: ✅ PIPELINE HEALTHY
```

---

## Understanding the Test Cases

### Witness Age Test Set
**Initial Query**: "What age must a witness be to a will?"
- Should find: SA succession law docs mentioning "14 years"
- Related keywords: witness, testament, will, age requirement

**Follow-up**: "What other requirements must they meet?"
- Should find: Witness competency, presence, capacity
- Context: Building on previous answer about age

### Eviction Law Test Set
**Initial Query**: "What are the requirements for eviction?"
- Should find: PIE Act, unlawful occupation, notice period
- Related keywords: eviction, notice, court order, occupation

**Follow-up**: "How long does the process take?"
- Should find: Timeline, notice periods, court procedures
- Context: Details about eviction process mentioned in first query

### Unfair Dismissal Test Set
**Initial Query**: "What remedies are available for unfair dismissal?"
- Should find: Labour Court decisions, reinstatement, compensation
- Related keywords: unfair dismissal, remedies, Labour Court

**Follow-up**: "Who has to prove it was unfair?"
- Should find: Burden of proof, substantive fairness, procedural fairness
- Context: Legal burden framework related to dismissal fairness

---

## Environment Variables Required

```bash
# .env file needs:
HUGGINGFACE_API_KEY=hf_XXXXXX...
ASTRA_DB_APPLICATION_TOKEN=AstraCS:...
ASTRA_DB_API_ENDPOINT=https://xxxxx.apps.astra.datastax.com
ENDPOINT=https://xxxxx.apps.astra.datastax.com  # Same as above
```

---

## Troubleshooting

### Error: "HUGGINGFACE_API_KEY not set"
```bash
# Add to .env:
HUGGINGFACE_API_KEY=hf_your_key_here
```

### Error: "Astra DB connection failed"
```bash
# Verify in .env:
ASTRA_DB_APPLICATION_TOKEN=AstraCS:...
ASTRA_DB_API_ENDPOINT=https://xxxxx-region.apps.astra.datastax.com
```

### Error: "Collection not found"
- Make sure documents were ingested first:
```bash
npm run ingest -- ./data/
```

### All queries return "No vectors in documents"
- Documents need embedding:
```bash
npm run reembed-docs
```

---

## Advanced Debugging

### Test Single Query
```bash
npx tsx -e "
import { test } from './scripts/test-rag.ts';
test('What age must a witness be?');
"
```

### Check Database
```bash
npm run check-db  # Lists documents
npm run count-db-docs  # Document count
```

### View Raw Document
```bash
# Check if documents have vectors:
npx tsx scripts/check-db-vectors.ts
```

---

## Success Workflow

1. **Run full diagnostics**
   ```bash
   npm run test:comprehensive
   ```

2. **Check pass rate**
   - 90%+: Pipeline healthy ✅
   - 80-89%: Run re-embed
   - <80%: Critical fix needed

3. **If needed, re-embed**
   ```bash
   npm run reembed-docs
   ```

4. **Verify fix**
   ```bash
   npm run diagnose-rag
   npm run test:comprehensive
   ```

5. **Test in UI**
   - Ask: "What age must a witness be?"
   - Follow-up: "What else must they meet?"
   - Should get answers from knowledge base ✅

---

## What These Tests Prove

✅ **Vector embeddings are stored**
- Documents have `$vector` field with 1024-dim vectors
- Vectors match embedding model (intfloat/multilingual-e5-large)

✅ **Vector search works**
- Queries can be embedded
- Similar documents are ranked correctly
- Similarity scores are meaningful

✅ **Knowledge base is accessible**
- Witness age queries return witness law docs
- Eviction queries return eviction law docs
- Context is preserved across follow-ups

✅ **System handles follow-ups**
- Initial query establishes context
- Follow-up questions find related documents
- Knowledge base has comprehensive coverage

---

## Next Steps After Passing Tests

1. **Monitor health regularly**
   ```bash
   npm run diagnose-rag  # Weekly check
   ```

2. **Test new documents**
   After ingesting new docs:
   ```bash
   npm run reembed-docs
   npm run test:comprehensive
   ```

3. **Improve retrieval** (optional)
   - Add query expansion
   - Implement hybrid search
   - Add reranking

See `FIX_KNOWLEDGE_BASE.md` for advanced improvements.

---

## Summary

| Test | Command | Time | Purpose |
|------|---------|------|---------|
| Quick Check | `npm run diagnose-rag` | 1 min | Health status |
| Vector Search | `npm run test-rag` | 2 min | Core functionality |
| Comprehensive | `npm run test:comprehensive` | 5 min | Full pipeline |
| All Together | `npm run test:comprehensive` | 5 min | Complete diagnosis |

**Start here**: `npm run test:comprehensive`
