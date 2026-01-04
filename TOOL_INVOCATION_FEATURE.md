# Tool Invocation from Chat - Feature Documentation

## Overview

Users can now access legal tools directly from the chat interface by simply mentioning them in their messages. The system automatically detects tool invocations and offers to open the appropriate tool.

## How It Works

### 1. Tool Detection

The system detects tool invocations using:
- **Exact phrase matching** (e.g., "analyze contract", "simplify document")
- **Keyword matching** (e.g., mentions of "contract" + "analyze")
- **Confidence scoring** (only shows tool card if confidence ≥ 70%)

### 2. Supported Tools

Users can invoke these tools from chat:

1. **Contract Analyzer**
   - Phrases: "contract analyzer", "analyze contract", "contract analysis", "perspective analyzer"
   - Keywords: contract, agreement, analyze, perspective, risk, party a, party b

2. **Document Simplifier**
   - Phrases: "simplify", "simplifier", "simplify document", "plain language", "jargon"
   - Keywords: simplify, plain language, jargon, explain, simpler, easier

3. **Drafting Assistant**
   - Phrases: "draft", "drafting", "create document", "generate", "write contract"
   - Keywords: draft, create, generate, write, make, contract, document

4. **Clause Auditor**
   - Phrases: "audit", "clause auditor", "check clauses", "missing clauses", "audit contract"
   - Keywords: audit, clause, missing, check, review, clauses

5. **POPIA Checker**
   - Phrases: "popia", "popia checker", "data protection", "privacy", "compliance"
   - Keywords: popia, data protection, privacy, compliance, gdpr

6. **Document Compare**
   - Phrases: "compare", "compare documents", "diff", "difference", "version"
   - Keywords: compare, diff, difference, version, changes

### 3. User Experience

1. User types a message mentioning a tool (e.g., "Can you analyze this contract?")
2. System detects the tool invocation
3. A tool card appears below the user's message
4. User can click "Open Tool" to navigate to the tool
5. Tool card can be dismissed

### 4. Parameter Extraction

The system can extract parameters from messages:
- **Contract Analysis**: Detects perspective (Party A, Party B, Neutral)
- **Document Simplifier**: Detects target reading level
- **Drafting Assistant**: Detects document type

## Example Usage

### Example 1: Contract Analysis
**User:** "I need to analyze this contract from the employer's perspective"

**System Response:**
- Detects: Contract Analyzer (Party A perspective)
- Shows tool card
- User clicks "Open Tool" → Navigates to `/tools/contract-analysis`

### Example 2: Document Simplification
**User:** "Can you simplify this legal document to grade 8 level?"

**System Response:**
- Detects: Document Simplifier (Grade 8)
- Shows tool card
- User clicks "Open Tool" → Navigates to `/tools/simplify`

### Example 3: Drafting
**User:** "I need to draft a contract"

**System Response:**
- Detects: Drafting Assistant
- Shows tool card
- User clicks "Open Tool" → Navigates to `/tools/drafting`

## Technical Implementation

### Files Created/Modified

1. **`lib/tool-detector.ts`**
   - Tool detection logic
   - Parameter extraction
   - Confidence scoring

2. **`components/ToolInvocationCard.tsx`**
   - UI component for tool suggestions
   - Handles navigation to tools

3. **`components/ToolSuggestion.tsx`**
   - Component for assistant-suggested tools

4. **`app/context/ChatContext.tsx`**
   - Added tool detection to `sendMessage`
   - Stores tool invocation in message

5. **`components/ChatBubble.tsx`**
   - Displays tool invocation cards
   - Handles tool card interactions

6. **`app/types.ts`**
   - Added `ToolInvocation` interface
   - Extended `Message` type

## Future Enhancements

1. **Inline Tool Execution**: Execute tools directly in chat without navigation
2. **Tool Results in Chat**: Show tool results as part of the conversation
3. **Multi-Tool Workflows**: Chain multiple tools together
4. **Smart Suggestions**: AI suggests tools based on conversation context
5. **Tool Shortcuts**: Quick commands like `/analyze` or `/simplify`

## Testing

To test the feature:
1. Type: "I want to analyze a contract"
2. Type: "Can you simplify this document?"
3. Type: "I need to draft a legal document"
4. Type: "Check this contract for missing clauses"
5. Type: "Is this POPIA compliant?"

Each should show the appropriate tool card.


