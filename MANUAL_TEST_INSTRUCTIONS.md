# Manual Testing Instructions for Context Awareness Fix

## Prerequisites
1. Restart the Next.js development server to load the new code:
   ```bash
   # Kill any running Next.js processes
   # Then start fresh:
   cd docketdive
   npm run dev
   ```

2. Ensure Ollama is running with the required models

## Test Case: Wills and Witness Age

### Step 1: Ask about wills
**User message:**
```
What makes a will legally binding in South Africa?
```

**Expected response:**
- Should mention execution requirements
- Should mention witnesses
- Should mention signature requirements
- Should cite relevant sources

### Step 2: Follow-up about witness age
**User message:**
```
what age must a witness be
```

**Expected response (CORRECT):**
- ✅ Should mention **14 years old** (minimum age for witness to a will)
- ✅ Should mention "will" or "testament" in the context
- ✅ Should reference the Wills Act or similar legislation
- ❌ Should NOT mention 18 years (general witness age)

**What to look for in server logs:**
```
🔗 Context-enriched query: "what age must a witness be in context of wills"
```

This log message confirms the query enrichment is working.

## Additional Test Cases

### Test Case 2: Contracts and Breach
**Message 1:** "What are the remedies for breach of contract in South Africa?"
**Message 2:** "what is specific performance"

**Expected:** Should answer about specific performance as a remedy for breach of contract, not general definition

### Test Case 3: Marriage and Property
**Message 1:** "What are the different marriage regimes in South Africa?"
**Message 2:** "what happens to property"

**Expected:** Should answer about property in the context of marriage regimes

## Debugging

If context awareness isn't working:

1. **Check server logs** for:
   - `🔗 Context-enriched query:` - Confirms query enrichment
   - `📝 Query expansion:` - Shows expanded queries
   - `🏷️ Identified entities:` - Shows extracted entities

2. **Verify conversation history** is being passed:
   - Open browser dev tools
   - Check Network tab
   - Look at the POST request to `/api/chat`
   - Verify `conversationHistory` array is populated

3. **Check retrieval results**:
   - Look for `🔍 === RETRIEVAL START` in logs
   - Check `✅ Final results:` count
   - Verify relevant documents are being retrieved

## Success Criteria

✅ **PASS**: Follow-up questions are answered in the context of the previous topic
✅ **PASS**: Query enrichment logs appear in server console
✅ **PASS**: Specific information (like "14 years for wills") is retrieved correctly
❌ **FAIL**: Follow-up questions are answered generically without context
❌ **FAIL**: Wrong information is provided (like "18 years" for will witnesses)

## Troubleshooting

### Issue: Server not loading new code
**Solution:** 
```bash
# Kill all Node processes
taskkill /F /IM node.exe
# Restart server
npm run dev
```

### Issue: No query enrichment logs
**Solution:** Check that `conversationHistory` is being passed in the API request

### Issue: Wrong documents retrieved
**Solution:** Check if the database contains documents about witness age for wills

### Issue: Generic answers despite context
**Solution:** Verify the system prompt includes the enhanced context instructions
