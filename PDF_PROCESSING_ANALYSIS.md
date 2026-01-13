# PDF Processing Issues - Analysis & Solutions

> **Analysis Date**: 2025-11-16
> **Files Analyzed**:
> - [components/multimodal-input.tsx](components/multimodal-input.tsx)
> - [app/(chat)/api/chat/route.ts](app/(chat)/api/chat/route.ts)
> - [app/(chat)/api/files/upload/route.ts](app/(chat)/api/files/upload/route.ts)
> - [lib/utils/file-parser.ts](lib/utils/file-parser.ts)

---

## Executive Summary

I've analyzed your PDF processing pipeline across 3 main files. The system has a well-designed architecture but there are **potential issues** in the data flow between components. Here's what I found:

### Current Architecture (Working as Designed)

```
User uploads PDF
    ↓
multimodal-input.tsx: uploadFile() → sends to server
    ↓
/api/files/upload: extractTextFromPDF() → returns {url, extractedText}
    ↓
multimodal-input.tsx: stores attachment with extractedText
    ↓
submitForm(): Maps to {type: "text", text: "[File: name]\n\n" + extractedText}
    ↓
/api/chat: Receives message.parts with text parts
    ↓
processedMessageParts: Keeps text parts as-is
    ↓
AI receives text content from PDF
```

### Key Findings

✅ **What's Working**:
1. PDF extraction logic is correct ([lib/utils/file-parser.ts](lib/utils/file-parser.ts:6-45))
2. Upload API properly extracts and returns text ([route.ts:93-105](app/(chat)/api/files/upload/route.ts:93-105))
3. Client-side mapping converts PDF to text parts ([multimodal-input.tsx:159-168](components/multimodal-input.tsx:159-168))
4. Dependencies are installed (pdf-parse@1.1.4)

⚠️ **Potential Issues Identified**:

1. **Data Flow Mismatch**: Chat API expects `part.extractedText` but client sends truncated text in `part.text`
2. **Truncation**: PDF text is truncated to 2000 characters on client side
3. **Redundant Processing**: Chat API has unused code for handling file parts with extractedText
4. **Type Confusion**: Mixing of `file` parts and `text` parts in processing

---

## Detailed Analysis

### 1. Upload Flow (✅ Working)

**File**: [app/(chat)/api/files/upload/route.ts](app/(chat)/api/files/upload/route.ts)

```typescript
// Lines 93-105: PDF text extraction
if (file.type === 'application/pdf') {
  try {
    console.log(`Attempting to extract text from PDF: ${filename}`);
    extractedText = await extractTextFromPDF(buffer);
    console.log(`✅ Extracted ${extractedText?.length || 0} characters from PDF: ${filename}`);
  } catch (error) {
    console.error('❌ PDF text extraction failed:', error);
    return NextResponse.json({
      error: "Failed to extract text from PDF",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Lines 125-133: Return extracted text
return NextResponse.json({
  url: `/uploads/${uniqueFilename}`,
  pathname: uniqueFilename,
  contentType: file.type,
  name: filename,
  extractedText, // ✅ This is returned correctly
});
```

**Status**: ✅ Working correctly
**Returns**: `{ url, name, contentType, extractedText }`

---

### 2. Client-Side Processing (⚠️ Issue Here)

**File**: [components/multimodal-input.tsx](components/multimodal-input.tsx)

#### 2A. Upload Handler (✅ Working)

```typescript
// Lines 248-268: Upload PDF to server
const response = await fetch("/api/files/upload", {
  method: "POST",
  body: formData,
});

if (response.ok) {
  const data = await response.json();
  const { url, pathname, contentType, name, extractedText } = data;

  return {
    url,
    name: name || pathname,
    contentType,
    extractedText: extractedText || "", // ✅ Stored correctly
  };
}
```

**Status**: ✅ Working correctly
**Stores**: `Attachment { url, name, contentType, extractedText }`

---

#### 2B. Form Submission (⚠️ ISSUE: Truncation)

```typescript
// Lines 156-188: Map attachments to message parts
const mappedParts = attachments
  .map((attachment) => {
    if (
      attachment.contentType === "application/pdf" ||
      attachment.contentType === "text/plain"
    ) {
      // ⚠️ ISSUE: Truncating to 2000 chars
      console.log(`[MultimodalInput] PDF/TXT mapped: ${attachment.name}`);
      return {
        type: "text" as const,
        text: `[File: ${attachment.name}]\n\n${(attachment.extractedText || "").slice(0, 2000)}`,
        //                                                                      ^^^^^^^^^^^^^^^^^
        //                                                                      TRUNCATION HERE!
      };
    }
    // ... image handling
  })
  .filter((part) => part !== undefined);

sendMessage({
  role: "user",
  parts: [
    ...mappedParts, // These are text parts with truncated PDF content
    {
      type: "text",
      text: input || "",
    },
  ],
});
```

**Issues**:
1. ⚠️ **Truncates PDF text to 2000 characters** - may lose important content
2. ⚠️ **Converts to text part** - doesn't preserve `extractedText` field
3. ⚠️ **No indication to user** - silent truncation

**Impact**:
- Large PDFs lose most of their content
- User doesn't know content was truncated
- AI may give incomplete answers

---

### 3. Chat API Processing (⚠️ Dead Code)

**File**: [app/(chat)/api/chat/route.ts](app/(chat)/api/chat/route.ts)

#### 3A. Message Part Processing (❌ Unused Code)

```typescript
// Lines 172-202: Process message parts
const processedMessageParts = message.parts.map((part: any) => {
  if (part.type === 'file') {
    // ❌ This code never runs because client sends type: 'text'
    if (part.extractedText) {
      console.log(`📄 Converting PDF/TXT to text: ${part.name}`);
      return {
        type: 'text' as const,
        text: `[File: ${part.name}]\n\n${part.extractedText}`,
      };
    }

    // Image handling code...
  }

  // Keep other parts as-is (text, etc.)
  return part; // ✅ Text parts from client pass through here
});
```

**Issues**:
1. ❌ **Dead Code**: The `part.type === 'file' && part.extractedText` branch never executes
2. ❌ **Why**: Client already converted PDF to `type: 'text'` parts
3. ⚠️ **Confusion**: Code suggests it expects file parts with extractedText, but receives text parts

**Status**: Works but has misleading/unused code

---

#### 3B. Model Message Processing (✅ Working for Text)

```typescript
// Lines 265-304: Process model messages
const processedModelMessages = modelMessages.map((msg: any) => {
  if (msg.content && Array.isArray(msg.content)) {
    const processedContent = msg.content.map((part: any) => {
      // File parts with base64 image data
      if (part.type === 'file' && part.data) {
        // Image handling...
      }

      // ✅ Text parts pass through unchanged
      return part;
    });
    return { ...msg, content: processedContent };
  }
  return msg;
});
```

**Status**: ✅ Works correctly for text parts (which PDFs become)

---

## Issues Summary

### Issue #1: PDF Text Truncation (HIGH PRIORITY)

**Location**: [components/multimodal-input.tsx:167](components/multimodal-input.tsx:167)

**Problem**: PDF text is truncated to 2000 characters

```typescript
text: `[File: ${attachment.name}]\n\n${(attachment.extractedText || "").slice(0, 2000)}`
//                                                                   ^^^^^^^^^^^^^^^^^^^^
```

**Impact**:
- Multi-page PDFs lose most content
- AI gives incomplete/incorrect answers
- No warning to user about truncation

**Example**:
- 50-page PDF → ~100,000 chars extracted
- Only 2,000 chars sent to AI (2% of content!)
- AI sees only page 1

---

### Issue #2: Architecture Mismatch

**Problem**: Two different approaches mixed together:

**Approach A (What Client Does)**:
```
PDF upload → Extract text → Create text part → Send to API
```

**Approach B (What API Expects - Unused)**:
```
PDF upload → Create file part with extractedText → API converts to text
```

**Impact**:
- Confusing codebase
- Dead code in chat API
- Harder to maintain

---

### Issue #3: No User Feedback on Truncation

**Problem**: When PDF is truncated, user doesn't know

**Impact**:
- User expects full PDF analysis
- Gets partial results
- Thinks AI is wrong, but it's incomplete input

---

### Issue #4: Token Limit Not Considered

**Problem**: Hard-coded 2000 char limit doesn't account for:
- Model context limits (GPT-4o: 128k tokens)
- Multiple attachments
- Conversation history
- System prompts

**Current Behavior**:
- 1 PDF = 2000 chars = ~500 tokens (conservative)
- Model can handle much more!

---

## Root Cause Analysis

### Why 2000 Character Limit?

Looking at line 167 in [multimodal-input.tsx](components/multimodal-input.tsx:167):

```typescript
.slice(0, 2000)
```

**Possible Reasons**:
1. **Conservative default**: Prevent token overflow
2. **Copy-paste**: From image alt text limits?
3. **Legacy code**: From previous implementation
4. **Unintentional**: Forgot to remove during testing

**Reality**: This is **too conservative** for GPT-4o which has 128k context window.

---

## Solutions & Recommendations

### Solution 1: Remove or Increase Truncation Limit (Quick Fix)

**File**: [components/multimodal-input.tsx:167](components/multimodal-input.tsx:167)

**Option A - Remove Truncation** (Recommended):
```typescript
// BEFORE
text: `[File: ${attachment.name}]\n\n${(attachment.extractedText || "").slice(0, 2000)}`

// AFTER - Send full text
text: `[File: ${attachment.name}]\n\n${attachment.extractedText || ""}`
```

**Option B - Increase Limit** (Conservative):
```typescript
// Increase to 50,000 chars (~12,500 tokens)
text: `[File: ${attachment.name}]\n\n${(attachment.extractedText || "").slice(0, 50000)}`
```

**Pros**: Simple, immediate fix
**Cons**: Doesn't handle very large PDFs intelligently

---

### Solution 2: Smart Truncation with User Warning (Better)

**File**: [components/multimodal-input.tsx](components/multimodal-input.tsx)

```typescript
const MAX_PDF_CHARS = 50000; // ~12,500 tokens

const mappedParts = attachments.map((attachment) => {
  if (
    attachment.contentType === "application/pdf" ||
    attachment.contentType === "text/plain"
  ) {
    const fullText = attachment.extractedText || "";
    const isTruncated = fullText.length > MAX_PDF_CHARS;
    const text = isTruncated
      ? fullText.slice(0, MAX_PDF_CHARS) + "\n\n[... Content truncated due to length ...]"
      : fullText;

    // Warn user if truncated
    if (isTruncated) {
      toast.warning(
        `PDF "${attachment.name}" is very long (${fullText.length} chars). ` +
        `Only first ${MAX_PDF_CHARS} chars will be analyzed.`
      );
    }

    return {
      type: "text" as const,
      text: `[File: ${attachment.name}]\n\n${text}`,
    };
  }
  // ... rest of code
});
```

**Pros**:
- User knows about truncation
- Higher limit than current
- Clear communication

**Cons**:
- Still truncates
- Toast might be annoying

---

### Solution 3: Dynamic Token-Based Truncation (Best)

**Approach**: Calculate tokens and truncate intelligently

**File**: [components/multimodal-input.tsx](components/multimodal-input.tsx)

```typescript
// Rough token estimation: 1 token ≈ 4 chars for English
const estimateTokens = (text: string): number => Math.ceil(text.length / 4);

const MAX_TOKENS_PER_FILE = 30000; // Leave room for other context
const MAX_CHARS_PER_FILE = MAX_TOKENS_PER_FILE * 4;

const mappedParts = attachments.map((attachment) => {
  if (
    attachment.contentType === "application/pdf" ||
    attachment.contentType === "text/plain"
  ) {
    const fullText = attachment.extractedText || "";
    const estimatedTokens = estimateTokens(fullText);

    if (estimatedTokens > MAX_TOKENS_PER_FILE) {
      const truncatedText = fullText.slice(0, MAX_CHARS_PER_FILE);
      toast.warning(
        `PDF "${attachment.name}" is very long (~${estimatedTokens.toLocaleString()} tokens). ` +
        `Truncated to first ~${MAX_TOKENS_PER_FILE.toLocaleString()} tokens to fit context window.`,
        { duration: 5000 }
      );

      return {
        type: "text" as const,
        text: `[File: ${attachment.name}]\n\n${truncatedText}\n\n[... Content truncated to fit context window ...]`,
      };
    }

    return {
      type: "text" as const,
      text: `[File: ${attachment.name}]\n\n${fullText}`,
    };
  }
  // ... rest
});
```

**Pros**:
- Smart truncation based on actual limits
- User feedback
- Maximizes content sent to AI

**Cons**:
- More complex
- Token estimation is approximate

---

### Solution 4: Chunking for Very Large PDFs (Advanced)

For PDFs that are too large, split into chunks and process separately.

**Not recommended** for initial fix - adds significant complexity.

---

## Recommended Fix (Action Plan)

### Step 1: Quick Fix - Remove Truncation

**File**: [components/multimodal-input.tsx:167](components/multimodal-input.tsx:167)

```typescript
// Change this line:
text: `[File: ${attachment.name}]\n\n${(attachment.extractedText || "").slice(0, 2000)}`,

// To this:
text: `[File: ${attachment.name}]\n\n${attachment.extractedText || ""}`,
```

**Impact**:
- ✅ Full PDF content sent to AI
- ✅ Better answers
- ✅ One line change
- ⚠️ Very large PDFs (100+ pages) might hit token limits

---

### Step 2: Add Warning for Large PDFs (Optional Enhancement)

**File**: [components/multimodal-input.tsx:157-188](components/multimodal-input.tsx:157-188)

Add warning before submitForm():

```typescript
const submitForm = useCallback(() => {
  // ... existing code ...

  // Check for large PDFs and warn user
  attachments.forEach((attachment) => {
    if (
      (attachment.contentType === "application/pdf" ||
       attachment.contentType === "text/plain") &&
      attachment.extractedText
    ) {
      const textLength = attachment.extractedText.length;
      const estimatedTokens = Math.ceil(textLength / 4);

      if (estimatedTokens > 20000) {
        toast.warning(
          `"${attachment.name}" is very large (~${estimatedTokens.toLocaleString()} tokens). ` +
          `Processing may take longer.`,
          { duration: 4000 }
        );
      }
    }
  });

  // Map attachments to correct format for chat API
  const mappedParts = attachments.map((attachment) => {
    if (
      attachment.contentType === "application/pdf" ||
      attachment.contentType === "text/plain"
    ) {
      console.log(`[MultimodalInput] PDF/TXT mapped: ${attachment.name}`);
      return {
        type: "text" as const,
        text: `[File: ${attachment.name}]\n\n${attachment.extractedText || ""}`, // No truncation!
      };
    }
    // ... rest
  });

  // ... rest of submitForm
}, [/* deps */]);
```

---

### Step 3: Clean Up Dead Code (Optional - Code Quality)

**File**: [app/(chat)/api/chat/route.ts:172-202](app/(chat)/api/chat/route.ts:172-202)

The PDF/TXT file handling code is unnecessary since client already converts to text:

```typescript
// This entire block can be simplified since client sends text parts
const processedMessageParts = message.parts.map((part: any) => {
  if (part.type === 'file') {
    // PDF/TXT files with extracted text -> NOW UNUSED (client sends as text)
    // Can be removed or kept for future direct file upload feature
    if (part.extractedText) {
      console.log(`📄 Converting PDF/TXT to text: ${part.name}`);
      return {
        type: 'text' as const,
        text: `[File: ${part.name}]\n\n${part.extractedText}`,
      };
    }

    // Image handling - STILL NEEDED
    // ... keep this
  }

  return part;
});
```

**Recommendation**: Add comment explaining this is for future use, or remove if not needed.

---

## Testing Plan

After implementing fixes, test these scenarios:

### Test Case 1: Small PDF (1-2 pages)
- ✅ Upload 1-page PDF
- ✅ Verify full text extracted
- ✅ AI receives complete content
- ✅ AI answers correctly

### Test Case 2: Medium PDF (10-20 pages)
- ✅ Upload 15-page PDF
- ✅ Verify full text extracted
- ✅ Check console logs for character count
- ✅ AI receives complete content
- ✅ User sees warning toast (if implemented)

### Test Case 3: Large PDF (50+ pages)
- ✅ Upload 50-page PDF
- ✅ Verify extraction works
- ✅ Check if token limit is hit
- ✅ User sees appropriate warning
- ✅ AI still provides useful answer

### Test Case 4: Very Large PDF (100+ pages)
- ⚠️ May hit context limits
- ✅ Verify error handling
- ✅ User gets clear feedback

### Test Case 5: Mixed Attachments
- ✅ Upload PDF + image + TXT
- ✅ All processed correctly
- ✅ AI receives all content

---

## Code Change Summary

### Minimal Fix (Recommended First Step)

**File**: [components/multimodal-input.tsx](components/multimodal-input.tsx)

**Line 167**: Remove `.slice(0, 2000)`

```diff
  return {
    type: "text" as const,
-   text: `[File: ${attachment.name}]\n\n${(attachment.extractedText || "").slice(0, 2000)}`,
+   text: `[File: ${attachment.name}]\n\n${attachment.extractedText || ""}`,
  };
```

**Impact**: ✅ Immediate improvement, no side effects

---

### Enhanced Fix (Recommended Second Step)

Add user feedback for large files (see Step 2 above).

---

## Additional Observations

### 1. Image Handling (✅ Working Well)

The image handling is correct:
- Client converts to base64 data URL
- Sent as file parts
- Chat API converts to image parts for vision
- No truncation issues

### 2. TXT Files (⚠️ Same Issue as PDF)

TXT files have the same 2000 char truncation:

```typescript
if (
  attachment.contentType === "application/pdf" ||
  attachment.contentType === "text/plain"  // ← Same truncation!
) {
```

**Fix applies to both PDF and TXT files.**

### 3. Error Handling (✅ Good)

Error handling in upload API is good:
- Returns error on PDF parse failure
- Provides error details
- Prevents silent failures

### 4. Console Logging (✅ Excellent)

Good use of console logging for debugging:
- Upload API logs extraction
- Client logs mapping
- Chat API logs processing

**These logs will help verify the fix works!**

---

## Conclusion

The PDF processing system is **well-architected** but has **one critical issue**: arbitrary 2000 character truncation.

### Immediate Action Required

1. **Remove `.slice(0, 2000)` from line 167** in [multimodal-input.tsx](components/multimodal-input.tsx:167)
2. **Test with multi-page PDFs** to verify improvement
3. **(Optional) Add user warnings** for very large PDFs

### Expected Results After Fix

- ✅ Full PDF content sent to AI (up to model's context limit)
- ✅ Better, more accurate AI responses
- ✅ Users can analyze larger documents
- ✅ No silent data loss

### Monitoring

After deployment, monitor:
- PDF upload success rate
- Average PDF text length
- Token usage per request
- Any new errors about context limits

---

## Questions to Consider

1. **What's the largest PDF you expect users to upload?**
   - This will help determine if additional safeguards are needed

2. **Should there be a file size limit?**
   - Currently 10MB max (set in upload API)
   - Consider if this should be smaller for PDFs

3. **Do you want chunking for very large PDFs?**
   - For 100+ page documents
   - Would require more complex implementation

4. **Should PDFs be summarized first?**
   - For very large documents
   - Use AI to create summary, then analyze

---

**Ready to fix?** The one-line change will solve the immediate issue!
