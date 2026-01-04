# RAG Pipeline Test Checklist

## Your Issue
- ❌ Asked: "What age must a witness be?"
- ❌ System said: "Not in knowledge base"
- ❌ Should have said: "14 years old (from SA law)"
- **Root Cause**: Vector embeddings missing

---

## Step 1: Diagnose (1 min)
```bash
npm run diagnose-rag
```

**Check these:**
- [ ] ✅ Astra DB Connection
- [ ] ✅ Document Count (should be > 0)
- [ ] ✅ Vector Dimensions (should be 1024)
- [ ] ✅ Keyword Search (should find witness, age, 14)
- [ ] ✅ Document Metadata (should exist)

**Expected Health**: 100%
**Actual Health**: ?

---

## Step 2: Test Vector Search (2 min)
```bash
npm run test-rag
```

**Check these queries:**
- [ ] "What are the constitutional requirements for eviction in South Africa?"
- [ ] "Labour court unfair dismissal remedies"
- [ ] "Constitutional Court interpretation of property rights"

**Expected**: Each returns 5 results with 70%+ similarity

---

## Step 3: Comprehensive Test (5 min) ⭐ MAIN TEST
```bash
npm run test:comprehensive
```

**8 Test Sets (24 total queries)**:

### Witness Age (Initial + Follow-up)
- [ ] ✅ "What age must a witness be to a will?" → **14 years**
- [ ] ✅ "witness age requirement South Africa will"
- [ ] ✅ "14 years old witness testament"
- [ ] ✅ "What other requirements must they meet?"
- [ ] ✅ "witness presence requirements will making"
- [ ] ✅ "witness competency testator presence"

### Eviction Law (Initial + Follow-up)
- [ ] ✅ "What are the requirements for eviction?"
- [ ] ✅ "eviction PIE Act notice"
- [ ] ✅ "unlawful occupation eviction procedure"
- [ ] ✅ "How long does the process take?"
- [ ] ✅ "eviction timeline court order execution"
- [ ] ✅ "PIE Act notice period days"

### Unfair Dismissal (Initial + Follow-up)
- [ ] ✅ "What remedies are available for unfair dismissal?"
- [ ] ✅ "unfair dismissal remedies reinstatement compensation"
- [ ] ✅ "Labour Court unfair dismissal relief"
- [ ] ✅ "Who has to prove it was unfair?"
- [ ] ✅ "burden of proof unfair dismissal employer"
- [ ] ✅ "substantive fairness procedural fairness dismissal"

### Succession Law (Initial + Follow-up)
- [ ] ✅ "What is the order of intestate succession?"
- [ ] ✅ "intestate succession South Africa spouse children"
- [ ] ✅ "intestate heirs distribution estate"
- [ ] ✅ "What if there are multiple dependents?"
- [ ] ✅ "dependents inheritance share succession"
- [ ] ✅ "maintenance and dependents succession act"

**Expected Result**: 
```
Total Tests: 24
Passed: 22-24 ✅
Pass Rate: 90%+
```

---

## Step 4: Interpret Results

### Result A: Pass Rate = 100% ✅
```
✅ PIPELINE HEALTHY
```
- Go to Step 5: Test in UI
- No action needed

### Result B: Pass Rate = 80-99% ⚠️
```
⚠️  MOSTLY WORKING
```
- Some documents not embedded
- Fix: `npm run reembed-docs`
- Then retest: `npm run test:comprehensive`

### Result C: Pass Rate < 80% ❌
```
❌ CRITICAL - VECTORS MISSING
```
**DO THIS NOW**:
1. `npm run reembed-docs` (re-embed all docs)
2. Wait 5-10 minutes
3. `npm run test:comprehensive` (retest)

---

## Step 5: Test in Live UI

1. Start dev server:
```bash
npm run dev
```

2. Open http://localhost:3000

3. Ask these questions:

**Q1 (Initial Query)**:
> "What age must a witness be to a will in South Africa?"

**Expected Answer**:
> "According to South African succession law, a witness to a will must be at least 14 years old."

**Q2 (Follow-up)**:
> "What other requirements must they meet?"

**Expected Answer**:
> "In addition to age, a witness must:
> - Be mentally competent
> - Be present when the testator signs
> - Sign the will in the testator's presence
> - Have no interest in the estate"

---

## If Q2 Works ✅
System is using context-aware knowledge base retrieval.

**Success! Your RAG pipeline is working.**

---

## If Q2 Fails ❌
- System forgot Q1 context
- OR doesn't have follow-up docs

**Fix**:
1. Recheck vectors: `npm run diagnose-rag`
2. Verify comprehensive test: `npm run test:comprehensive`
3. Check if witness follow-up docs are ingested
4. Re-embed: `npm run reembed-docs`

---

## Quick Commands

| What | Command | Time |
|------|---------|------|
| Health check | `npm run diagnose-rag` | 1 min |
| Vector search | `npm run test-rag` | 2 min |
| Full test | `npm run test:comprehensive` | 5 min |
| Re-embed docs | `npm run reembed-docs` | 5-10 min |
| Test in UI | `npm run dev` + http://localhost:3000 | 2 min |

---

## Success Criteria Checklist

### Minimum (Must Have All ✅)
- [ ] Diagnostic health ≥ 80%
- [ ] Comprehensive test pass rate ≥ 90%
- [ ] Witness age question gets "14 years" answer
- [ ] Follow-up question finds related docs

### Ideal (Nice to Have)
- [ ] All 24 test queries pass
- [ ] Witness follow-up mentions competency/presence
- [ ] No embeddings errors
- [ ] Fast response time (<2s per query)

---

## Timeline
- Diagnose: 1 min
- Test vector search: 2 min
- Comprehensive test: 5 min
- **Total diagnosis time: 8 minutes**

If re-embed needed: +10 minutes

---

## Document for Feedback
After running tests, provide:

```
TEST RESULTS SUMMARY:
├─ Diagnostic Health: ___%
├─ Comprehensive Test Pass Rate: ___%
├─ Initial Witness Query: ✅/❌
├─ Follow-up Question Works: ✅/❌
└─ Errors/Issues: _____________
```

---

**START HERE**: `npm run test:comprehensive`
