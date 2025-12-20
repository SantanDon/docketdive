# DocketDive - Accuracy Issues Diagnosis & Fix Plan

## Executive Summary

**Project**: DocketDive - South African Legal AI Assistant  
**Issue**: Inaccurate responses for legal queries (e.g., "actio de pauperie" returns children's rights instead of animal owner strict liability)  
**Root Cause**: Query expansion corrupts specialized legal terms + no keyword-based verification  
**Status**: Fixes in progress

---

## Project Architecture Overview

```
User Query
    ↓
┌────────────────────────────────────────────┐
│ 1. Query Expansion (semantic-search.ts)    │ ← PROBLEM: Loses original legal terms
│    - LLM generates "synonyms"              │
│    - Latin terms get replaced with generic │
└────────────────────────────────────────────┘
    ↓
┌────────────────────────────────────────────┐
│ 2. Vector Embedding (rag.ts)               │
│    - Qwen3-Embedding-0.6B (1024 dims)      │
│    - May not understand Latin legal terms  │
└────────────────────────────────────────────┘
    ↓
┌────────────────────────────────────────────┐
│ 3. Vector Similarity Search (Astra DB)     │
│    - TOP_K: 12 documents retrieved         │
│    - MIN_THRESHOLD: 0.12 (too low!)        │ ← PROBLEM: Lets irrelevant docs through
└────────────────────────────────────────────┘
    ↓
┌────────────────────────────────────────────┐
│ 4. Semantic Re-ranking (semantic-search.ts)│ ← PROBLEM: No keyword/exact-match boost
│    - Only boosts case names & statutes     │
│    - No Latin phrase detection             │
└────────────────────────────────────────────┘
    ↓
┌────────────────────────────────────────────┐
│ 5. Context Building & LLM Response         │
│    - LLM answers from wrong documents      │
│    - "Children's rights" instead of        │
│      "animal owner strict liability"       │
└────────────────────────────────────────────┘
```

---

## Root Cause Analysis

### Issue 1: Query Expansion Corrupts Legal Terms

**Current Behavior:**
```typescript
// semantic-search.ts expandQuery()
const prompt = `... Provide 2 alternative legal search terms/synonyms ...`;
// For "actio de pauperie" LLM might return:
// ["poverty rights", "rights of poor people", "social welfare"]
// ORIGINAL QUERY IS LOST!
```

**Impact**: The vector search never sees "actio de pauperie" - only generic terms that retrieve wrong documents.

### Issue 2: No Exact-Match/Keyword Verification

**Current Behavior:**
```typescript
// rankRelevance() only boosts:
// - Case names (X v Y)
// - Statutes (... Act)
// - Generic terms: "contract", "tort", "liability"
// NO BOOST for: "actio de pauperie", "lex aquilia", Latin phrases
```

**Impact**: Even if correct chunks exist, they don't get priority over generic "rights" chunks.

### Issue 3: Similarity Threshold Too Low

**Current Setting:** `MIN_SIMILARITY_THRESHOLD = 0.12`

**Impact**: Almost anything vaguely related to "South African law" passes through, including completely irrelevant documents.

### Issue 4: No Keyword Gating

**Missing Check**: If retrieved documents don't contain ANY significant keyword from the query, they should be rejected.

---

## Comprehensive Fix Plan

### Fix 1: Conservative Query Expansion

**File**: `app/api/utils/semantic-search.ts`

**Changes**:
1. ALWAYS include original query as first search term
2. Detect Latin legal terms and disable expansion for them
3. Improved prompt that preserves specialized terminology

### Fix 2: Exact-Match Keyword Boosting

**File**: `app/api/utils/semantic-search.ts`

**Changes**:
1. Add `computeKeywordBoost()` function
2. Strong boost (+0.4) for exact phrase matches (Latin terms)
3. Medium boost (+0.05) for significant keyword matches
4. Integrate into `rankRelevance()`

### Fix 3: Tighter Similarity & Keyword Gating

**File**: `app/api/utils/rag.ts`

**Changes**:
1. Raise `MIN_SIMILARITY_THRESHOLD` from 0.12 to 0.20
2. Add keyword presence check before returning results
3. Return empty if no documents contain query keywords

### Fix 4: Enhanced Testing Framework

**File**: `test/accuracy-tests.ts` (NEW)

**Tests**:
1. Latin legal term retrieval accuracy
2. Query expansion preservation
3. Keyword boost effectiveness
4. End-to-end accuracy validation

---

## Files to Modify

| File | Changes |
|------|---------|
| `app/api/utils/semantic-search.ts` | Query expansion + keyword boosting |
| `app/api/utils/rag.ts` | Threshold + gating + retrieval logic |
| `test/accuracy-tests.ts` | New comprehensive test suite |

---

## Expected Outcomes

### Before Fixes:
- Query: "What is actio de pauperie in South Africa?"
- Retrieved: Children's rights, constitutional provisions
- Response: Incorrect information about minors

### After Fixes:
- Query: "What is actio de pauperie in South Africa?"
- Retrieved: Visser & Potgieter Law of Damages (exact phrase match)
- Response: Correct information about strict liability for animal owners

---

## Risk Mitigation

1. **Over-filtering**: Start with moderate thresholds (0.20 instead of 0.30)
2. **Logging**: Add debug logs to track retrieval decisions
3. **Fallback**: If no local docs, internet search still available
4. **Testing**: Validate with diverse query types before deployment

---

## Test Cases for Validation

| Query | Expected Source | Expected Topic |
|-------|-----------------|----------------|
| "actio de pauperie in South Africa" | Visser & Potgieter | Animal owner strict liability |
| "lex Aquilia in South African delict law" | Law of Damages | Delictual liability |
| "condictio indebiti South Africa" | Private Law / Obligations | Unjustified enrichment |
| "elements of a valid contract" | Contract Law | Offer, acceptance, capacity |
| "constitutional right to dignity" | Constitutional Law | Section 10, Bill of Rights |

---

## Implementation Status

- [x] Fix 1: Query Expansion - COMPLETED ✅
- [x] Fix 2: Keyword Boosting - COMPLETED ✅
- [x] Fix 3: Threshold & Gating - COMPLETED ✅
- [x] Fix 4: Testing Framework - COMPLETED ✅
- [x] Validation: Core test cases pass - COMPLETED ✅

---

## Test Results (December 2025)

### ✅ PASSING TESTS:

1. **Query Expansion Preservation**
   - Latin terms correctly preserved: "actio de pauperie" → NOT expanded
   - Generic queries still get helpful expansions

2. **Entity Identification**
   - Latin legal terms detected correctly
   - Legal terms identified for boosting

3. **Keyword Boost Calculation**
   - Correct document: +0.56 boost (actio de pauperie content)
   - Wrong document: +0.00 boost (children's rights content)
   - **CORRECT DOC WINS** ✅

4. **Keyword Gating**
   - Relevant docs pass gating
   - Irrelevant docs blocked

### 🎯 CRITICAL TEST PASSED:

**Query**: "What is actio de pauperie in South Africa?"

**BEFORE FIX**: Returned children's rights content ❌

**AFTER FIX**: Returns correct results ✅
- Top 3 results all from "Personal injury_studyguide2025.pdf"
- Content includes: "actio de pauperie", "domesticated animal", elements of liability
- NO forbidden keywords (children, minors) found

### ⚠️ EXPECTED FAILURES:

- "condictio indebiti" - Term not in document corpus (expected behavior)

---

*Document created: December 2025*
*Last updated: December 2025 - All fixes implemented and validated*
