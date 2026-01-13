# File Processing Issue - PDF and Non-Image Files

## ⚠️ Current Problem

You can **upload** PDF and other file types, but the AI **cannot process** them because:

### Why PDFs Don't Work

**Azure OpenAI GPT-4o only supports IMAGE files natively:**

- ✅ JPEG, PNG, GIF, WebP - Processed by AI vision
- ❌ PDF, TXT, CSV, JSON - **NOT processed** (ignored by AI)

The AI SDK's `convertToModelMessages()` function:

- Converts image URLs to proper vision format
- **Ignores** non-image file attachments
- PDFs are uploaded but never sent to the model

---

## 🔍 Current Behavior

### What Happens When You Upload a PDF:

1. ✅ **Upload**: PDF uploads successfully to `/public/uploads/`
2. ✅ **Preview**: Shows in chat input with "File" indicator
3. ✅ **Send**: Message sent with file attachment
4. ❌ **Processing**: AI receives message but **ignores the PDF**
5. ❌ **Result**: AI responds without reading the PDF content

### Example:

```
You: [Uploads report.pdf] "Summarize this document"

AI: "I don't see any document attached. Could you provide
     the document you'd like me to summarize?"
```

**Why?** The PDF file reference is in the message, but GPT-4o can't read PDFs directly.

---

## ✅ Solutions

### Option 1: Only Allow Images (Recommended for Now)

Revert the file type support to **images only** since those are the only files the AI can process.

**Changes needed:**

1. Update `app/(chat)/api/files/upload/route.ts`
2. Update `app/(chat)/api/chat/schema.ts`
3. Update `components/multimodal-input.tsx`

### Option 2: Extract Text from PDFs/Text Files

Process files server-side before sending to AI:

- Extract text from PDFs using `pdf-parse`
- Read text files directly
- Send extracted text as message content

**Requires:**

- PDF parsing library
- Server-side processing
- More complex implementation

### Option 3: Disable Upload for Reasoning Model (Current)

Currently, file uploads are disabled for the reasoning model but allowed for regular model. This is inconsistent since regular model also can't process PDFs.

---

## 📝 Recommended Solution: Images Only

Let me revert the changes to support **images only** until we implement proper PDF text extraction:

### Why Images Only?

1. **Works Out of Box**: GPT-4o vision processes images natively
2. **No Extra Processing**: No need for PDF parsing
3. **Clear UX**: Users know what to expect
4. **Reliable**: No confusion about what files AI can read

### Supported Use Cases:

- ✅ Upload screenshots
- ✅ Upload photos
- ✅ Upload diagrams/charts
- ✅ Upload handwritten notes (OCR)
- ✅ Upload memes/images with text

---

## 🛠️ Implementation: PDF Text Extraction (Future)

If you want PDF support, here's what's needed:

### Step 1: Install PDF Parser

```bash
pnpm add pdf-parse
pnpm add -D @types/pdf-parse
```

### Step 2: Update Upload Route

```typescript
// app/(chat)/api/files/upload/route.ts
import pdf from "pdf-parse";

export async function POST(request: Request) {
  // ... existing code ...

  const file = formData.get("file") as Blob;
  const fileBuffer = await file.arrayBuffer();

  // Extract text from PDF
  if (file.type === "application/pdf") {
    const pdfData = await pdf(Buffer.from(fileBuffer));
    const extractedText = pdfData.text;

    // Return both file URL and extracted text
    return NextResponse.json({
      url: `/uploads/${uniqueFilename}`,
      name: filename,
      contentType: file.type,
      extractedText: extractedText, // NEW
    });
  }

  // ... rest of code ...
}
```

### Step 3: Update Message Creation

```typescript
// components/multimodal-input.tsx
sendMessage({
  role: "user",
  parts: [
    // Add extracted text as separate text part
    ...attachments
      .filter((a) => a.extractedText)
      .map((a) => ({
        type: "text" as const,
        text: `[Content from ${a.name}]\n${a.extractedText}`,
      })),
    // Only send image files as file attachments
    ...attachments
      .filter((a) => a.contentType?.startsWith("image"))
      .map((attachment) => ({
        type: "file" as const,
        url: attachment.url,
        name: attachment.name,
        mediaType: attachment.contentType,
      })),
    {
      type: "text",
      text: input,
    },
  ],
});
```

### Step 4: Update TypeScript Types

```typescript
// lib/types.ts
export type Attachment = {
  url: string;
  name: string;
  contentType: string;
  extractedText?: string; // NEW
};
```

---

## 🎯 Quick Fix: Revert to Images Only

Let me revert the file type changes to only support images:

**Files to update:**

1. `app/(chat)/api/files/upload/route.ts` - Only allow JPEG, PNG, GIF, WebP
2. `app/(chat)/api/chat/schema.ts` - Remove PDF, TXT, CSV, JSON
3. `components/multimodal-input.tsx` - Update accept attribute

This ensures:

- Only files that AI can process are allowed
- Clear user expectations
- No confusion about what works

---

## 📊 File Type Compatibility Matrix

| File Type | Upload | AI Vision | Text Extraction    | Status          |
| --------- | ------ | --------- | ------------------ | --------------- |
| JPEG      | ✅     | ✅        | N/A                | ✅ Works        |
| PNG       | ✅     | ✅        | N/A                | ✅ Works        |
| GIF       | ✅     | ✅        | N/A                | ✅ Works        |
| WebP      | ✅     | ✅        | N/A                | ✅ Works        |
| PDF       | ✅     | ❌        | ⚠️ Not Implemented | ❌ Doesn't Work |
| TXT       | ✅     | ❌        | ⚠️ Not Implemented | ❌ Doesn't Work |
| CSV       | ✅     | ❌        | ⚠️ Not Implemented | ❌ Doesn't Work |
| JSON      | ✅     | ❌        | ⚠️ Not Implemented | ❌ Doesn't Work |

---

## 🔮 Future Enhancements

### Advanced File Processing:

1. **PDF Text Extraction**:

   - Use `pdf-parse` library
   - Extract text and send to AI
   - Preserve formatting where possible

2. **Text File Reading**:

   - Read TXT, CSV, JSON directly
   - Send content as text message
   - Simple implementation

3. **OCR for Images**:

   - Extract text from images with Tesseract.js
   - Useful for screenshots with text
   - Enhance AI understanding

4. **Document Parsing**:

   - Parse Word docs (.docx)
   - Parse Excel sheets (.xlsx)
   - Convert to text/markdown

5. **Multi-Modal RAG**:
   - Index document content
   - Use vector database
   - Retrieve relevant sections
   - More advanced implementation

---

## 📖 Alternative: Manual Text Copy

**Current workaround** for users:

1. Open PDF in another app
2. Copy text manually
3. Paste into chat
4. Ask AI to process

**Example:**

```
You: Here's the content from my PDF:

[Paste PDF text here]

Please summarize this document.
```

This works but is not ideal UX.

---

## 🎬 Decision Time

**Choose one:**

### A) Keep Images Only ✅ (Recommended)

- Simple, reliable
- No confusion
- Works perfectly
- **Do this now**

### B) Add PDF Text Extraction 🔧

- Better UX
- More complex
- Requires implementation
- **Do this later**

### C) Keep Current (Broken) ❌

- PDFs upload but don't work
- Confusing for users
- Not recommended

---

## 📝 What Should I Do?

**I recommend reverting to images only for now.** Shall I:

1. ✅ **Revert file types to images only** (JPEG, PNG, GIF, WebP)
2. ✅ **Update documentation** to reflect image-only support
3. ✅ **Ensure consistent behavior** across the app

Then later, if you want PDF support, we can implement proper text extraction.

**Your choice:** Should I revert to images only? Or would you prefer to implement PDF text extraction now?

---

**Created**: November 7, 2025  
**Issue**: PDFs upload but aren't processed by AI  
**Cause**: GPT-4o only supports images natively  
**Solution**: Revert to images only OR implement text extraction
