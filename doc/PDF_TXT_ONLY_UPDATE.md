# File Upload Restriction Update - PDF & TXT Only

**Date**: November 7, 2025

## 🎯 Change Summary

The file upload feature has been **restricted to PDF and TXT files only**. Image support (JPEG, PNG, GIF, WebP) has been removed.

---

## ✅ What Changed

### 1. Frontend File Input

**File**: `components/multimodal-input.tsx`

**Before**:

```tsx
accept = "image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain";
```

**After**:

```tsx
accept = "application/pdf,text/plain";
```

**Changes**:

- ✅ Removed image MIME types from accept attribute
- ✅ Removed image paste handler (no longer needed)
- ✅ Removed paste event listener

---

### 2. Backend Validation

**File**: `app/(chat)/api/files/upload/route.ts`

**Before**:

```typescript
.refine((file) => [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
].includes(file.type), {
  message: "File type should be JPEG, PNG, GIF, WebP, PDF, or TXT",
})
```

**After**:

```typescript
.refine((file) => [
  "application/pdf",
  "text/plain",
].includes(file.type), {
  message: "File type should be PDF or TXT",
})
```

**Changes**:

- ✅ Removed image MIME types from validation
- ✅ Updated error message

---

### 3. Documentation Updates

**Updated Files**:

1. ✅ `FILE_UPLOAD_GUIDE.md` - Updated to reflect PDF/TXT only support
2. ✅ `PDF_TXT_SUPPORT.md` - Removed image support references
3. ✅ `MODIFICATIONS.md` - Updated file upload description

---

## 📝 Current File Upload Behavior

### Accepted Files

- **PDF** (`.pdf`, `application/pdf`) - Text extracted using `pdf-parse`
- **TXT** (`.txt`, `text/plain`) - Read as UTF-8 text

### Rejected Files

- ❌ Images (JPEG, PNG, GIF, WebP)
- ❌ Any other file types

### File Size Limit

- **Maximum**: 10 MB per file

### Upload Methods

1. **Click paperclip icon** - Select PDF/TXT files
2. ~~Paste images~~ - Removed (not applicable to PDF/TXT)
3. **Drag & drop** - May work depending on browser

---

## 🔧 How It Works

### Upload Flow

```
User selects PDF/TXT file
    ↓
File uploaded to /public/uploads/
    ↓
Text extracted from file
    ↓
Text stored in extractedText field
    ↓
Text sent to LLM as text content
    ↓
LLM processes and responds
```

### Text Extraction

- **PDF**: Uses `pdf-parse` library to extract text from PDF documents
- **TXT**: Reads file as UTF-8 text

### LLM Processing

When a PDF/TXT file is sent to the AI:

```typescript
{
  type: "text",
  text: `[File: ${attachment.name}]\n\n${attachment.extractedText}`
}
```

The LLM receives the extracted text and can:

- Answer questions about the content
- Summarize the document
- Extract specific information
- Analyze the text
- Compare multiple documents

---

## 🧪 Testing

### Test 1: Upload a PDF

1. Click the paperclip icon
2. Select a `.pdf` file
3. ✅ File should upload successfully
4. ✅ Text should be extracted
5. ✅ You can ask the AI questions about the PDF content

### Test 2: Upload a TXT file

1. Click the paperclip icon
2. Select a `.txt` file
3. ✅ File should upload successfully
4. ✅ Content should be read
5. ✅ You can ask the AI about the text

### Test 3: Try to upload an image

1. Click the paperclip icon
2. Try to select a `.jpg` or `.png` file
3. ❌ File picker should **not show** image files (filtered by accept attribute)

### Test 4: Paste an image

1. Copy an image to clipboard
2. Try to paste into chat input
3. ✅ Should paste normally (image paste handler removed)
4. ❌ Won't upload as an attachment

---

## 🔄 Reverting (If Needed)

To restore image support:

### 1. Update Frontend

**File**: `components/multimodal-input.tsx`

```tsx
accept = "image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain";
```

### 2. Update Backend

**File**: `app/(chat)/api/files/upload/route.ts`

```typescript
.refine((file) => [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
].includes(file.type), {
  message: "File type should be JPEG, PNG, GIF, WebP, PDF, or TXT",
})
```

### 3. Restore Paste Handler

Add back the paste event listener in `components/multimodal-input.tsx`

---

## 📦 Package Dependencies

**Required for PDF/TXT processing**:

```json
{
  "pdf-parse": "^1.1.1"
}
```

**Not needed** (removed):

- No special packages required for images

---

## 🎯 Why This Change?

This restriction was made to:

1. **Focus on document processing** - PDF and TXT files with text extraction
2. **Simplify file handling** - Only text-based documents
3. **Remove vision features** - GPT-4o vision not needed
4. **Streamline processing** - All files go through text extraction

---

## ✅ Verification Checklist

- [x] Frontend accepts only PDF/TXT files
- [x] Backend validates only PDF/TXT files
- [x] Image paste handler removed
- [x] Documentation updated
- [x] No TypeScript errors
- [x] File size limit: 10 MB
- [x] Text extraction working for both PDF and TXT
- [x] Files stored in `/public/uploads/`
- [x] Extracted text sent to LLM

---

## 📚 Related Documentation

- `FILE_UPLOAD_GUIDE.md` - Complete file upload guide
- `PDF_TXT_SUPPORT.md` - PDF/TXT implementation details
- `MODIFICATIONS.md` - All modifications summary
- `lib/utils/file-parser.ts` - Text extraction utilities

---

**Status**: ✅ **Complete**  
**File Types Supported**: PDF, TXT only  
**Image Support**: Removed
