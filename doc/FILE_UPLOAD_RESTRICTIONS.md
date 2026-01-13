# File Upload Restrictions & Requirements

## 📋 Current Upload Restrictions

### ✅ Allowed File Types

**4 file types are currently supported:**

1. **PDF Files** (`application/pdf`)
   - `.pdf` extension
   - Text is automatically extracted using `pdf-parse`
   - Extracted text is sent to LLM
2. **Text Files** (`text/plain`)

   - `.txt` extension
   - Content is read as UTF-8 text
   - Full text is sent to LLM

3. **PNG Images** (`image/png`)
   - `.png` extension
   - Sent directly to Azure OpenAI GPT-4o (vision support)
   - No text extraction needed
4. **JPEG Images** (`image/jpeg`)
   - `.jpg`, `.jpeg` extensions
   - Sent directly to Azure OpenAI GPT-4o (vision support)
   - No text extraction needed

### ❌ NOT Allowed File Types

The following file types are **blocked**:

- ❌ GIF images (`.gif`)
- ❌ WebP images (`.webp`)
- ❌ Word documents (`.doc`, `.docx`)
- ❌ Excel files (`.xls`, `.xlsx`)
- ❌ PowerPoint (`.ppt`, `.pptx`)
- ❌ Code files (`.js`, `.py`, `.java`, etc.)
- ❌ Archives (`.zip`, `.rar`, etc.)
- ❌ Any other file types

---

## 📏 File Size Limit

### Maximum File Size: **10 MB**

```typescript
file.size <= 10 * 1024 * 1024; // 10 MB in bytes
```

**Why 10 MB?**

- Large enough for most documents (100+ page PDFs)
- Prevents server overload
- Reasonable for text extraction processing
- Example: A 239-page PDF tested was 3.9 MB

---

## 🔍 Validation Layers

### 1. **Client-Side Validation** (Browser)

**File**: `components/multimodal-input.tsx`

```tsx
<input
  type="file"
  accept="application/pdf,text/plain,image/png,image/jpeg"
  multiple
/>
```

**What it does:**

- Shows only PDF, TXT, PNG, and JPG files in file picker
- Users can't select other file types (on most browsers)
- Not a security measure - just UX improvement

### 2. **Server-Side Validation** (API)

**File**: `app/(chat)/api/files/upload/route.ts`

```typescript
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 10 * 1024 * 1024, {
      message: "File size should be less than 10MB",
    })
    .refine(
      (file) =>
        ["application/pdf", "text/plain", "image/png", "image/jpeg"].includes(
          file.type
        ),
      {
        message: "File type should be PDF, TXT, PNG, or JPG",
      }
    ),
});
```

**What it validates:**

- ✅ File size must be ≤ 10 MB
- ✅ File type must be `application/pdf`, `text/plain`, `image/png`, OR `image/jpeg`
- ✅ File must exist (not empty)

**Error Messages:**

- `"File size should be less than 10MB"` - If file > 10 MB
- `"File type should be PDF, TXT, PNG, or JPG"` - If wrong file type
- `"No file uploaded"` - If no file provided

---

## 📝 Upload Process Flow

```
1. User selects file
   ↓
2. Client validates (accept attribute)
   ↓
3. Upload starts → POST /api/files/upload
   ↓
4. Server validates (Zod schema)
   ├─ Size check (≤10MB)
   └─ Type check (PDF or TXT)
   ↓
5. If valid:
   ├─ Extract text (PDF) or read content (TXT)
   ├─ Save to public/uploads/
   └─ Return file data + extracted text
   ↓
6. If invalid:
   └─ Return error message
```

---

## 🎯 Why These Restrictions?

### PDF & TXT Only

**Reasons:**

1. **Text Extraction** - These formats have reliable text extraction
2. **Azure OpenAI Compatibility** - Must convert to text anyway
3. **Simple Processing** - No complex parsing needed
4. **Security** - Reduces attack surface
5. **Focus** - Document-based AI chat (not image analysis)

### 10 MB Limit

**Reasons:**

1. **Performance** - Faster uploads and processing
2. **Memory** - Won't overload server memory
3. **API Limits** - OpenAI has token limits anyway
4. **User Experience** - Quick response times
5. **Practical** - Most documents are < 10 MB

---

## 📊 File Size Examples

| Document Type  | Typical Size  | Fits in 10MB?           |
| -------------- | ------------- | ----------------------- |
| 1-page PDF     | 50-200 KB     | ✅ Yes (plenty of room) |
| 10-page PDF    | 200 KB - 1 MB | ✅ Yes                  |
| 50-page PDF    | 1-3 MB        | ✅ Yes                  |
| 100-page PDF   | 2-5 MB        | ✅ Yes                  |
| 239-page PDF   | 3.9 MB        | ✅ Yes (tested!)        |
| 500-page PDF   | 8-15 MB       | ⚠️ Maybe (might exceed) |
| 1000-page PDF  | 15-30 MB      | ❌ No (too large)       |
| Small TXT file | 1-100 KB      | ✅ Yes                  |
| Large TXT file | 1-5 MB        | ✅ Yes                  |

---

## 🔧 How to Modify Restrictions

### Increase File Size Limit

**File**: `app/(chat)/api/files/upload/route.ts`

```typescript
// Change this line:
.refine((file) => file.size <= 10 * 1024 * 1024, {
  message: "File size should be less than 10MB",
})

// To (for 20 MB):
.refine((file) => file.size <= 20 * 1024 * 1024, {
  message: "File size should be less than 20MB",
})
```

### Add More File Types

**Example: Add Word documents**

```typescript
// 1. Install docx parser
// pnpm add docx

// 2. Update schema
.refine((file) => [
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
].includes(file.type), {
  message: "File type should be PDF, TXT, or DOCX",
})

// 3. Update client accept
<input accept="application/pdf,text/plain,.docx" />

// 4. Add extraction logic
if (file.type.includes('wordprocessing')) {
  extractedText = await extractTextFromDocx(buffer);
}
```

---

## 🚨 Common Errors & Solutions

### Error: "File size should be less than 10MB"

**Problem:** File is too large
**Solution:**

- Compress the PDF
- Split into smaller files
- Use online PDF compressor
- Increase size limit (see above)

### Error: "File type should be PDF or TXT"

**Problem:** Wrong file type (e.g., .docx, .jpg)
**Solution:**

- Convert to PDF first
- Save as .txt if it's text
- Add support for that file type (see above)

### Error: "No file uploaded"

**Problem:** File didn't reach server
**Solution:**

- Check network connection
- Try smaller file
- Check browser console for errors

### Error: "Failed to extract text from PDF"

**Problem:** PDF parsing failed
**Solution:**

- PDF might be corrupted
- PDF might be password-protected
- PDF might be scanned images (no text)
- Try a different PDF

---

## 📱 Multi-File Upload

### Is it supported?

**Yes!** Multiple files can be uploaded at once:

```tsx
<input
  multiple // Allows multiple file selection
  type="file"
/>
```

**Validation:**

- Each file is validated individually
- Each must be ≤10MB
- Each must be PDF or TXT
- All files are processed in parallel

**Example:**

```
Upload: file1.pdf (5MB) + file2.txt (1MB) + file3.pdf (3MB)
Result: All 3 files uploaded ✅
Total: 9MB (within individual limits)
```

---

## 🔐 Security Considerations

### Current Security Measures

1. **File Type Validation**

   - Only PDF and TXT allowed
   - Reduces attack vectors

2. **Size Limit**

   - Prevents DoS attacks
   - Protects server resources

3. **Unique Filenames**

   - Files saved as UUID + extension
   - Prevents filename conflicts
   - Prevents path traversal

4. **Safe Parsing**
   - Uses well-tested libraries (`pdf2json`)
   - Error handling for malformed files

### What's NOT Protected

⚠️ **No virus scanning** - Use external tools if needed
⚠️ **No content validation** - Malicious text could be uploaded
⚠️ **No rate limiting** - Currently unlimited uploads
⚠️ **Authentication disabled** - Anyone can upload

---

## 📂 Where Files are Stored

### Local Storage Path

```
public/uploads/<UUID>.<extension>
```

**Example:**

```
public/uploads/330aae86-916d-4c58-94ca-002c9b5b713b.pdf
```

**Accessible via:**

```
http://localhost:3000/uploads/330aae86-916d-4c58-94ca-002c9b5b713b.pdf
```

### File Naming

- **UUID v4** - Random unique identifier
- **Original extension** - Preserved (.pdf or .txt)
- **No original filename** - Security measure

---

## 📊 Summary

| Restriction        | Value                  | Reason                          |
| ------------------ | ---------------------- | ------------------------------- |
| **File Types**     | PDF, TXT only          | Text extraction + compatibility |
| **Max Size**       | 10 MB                  | Performance + API limits        |
| **Multiple Files** | Yes                    | User convenience                |
| **Authentication** | Disabled               | Development mode                |
| **Storage**        | Local (public/uploads) | Development mode                |

---

## 🎯 Quick Reference

### Upload Requirements Checklist

✅ File must be PDF (`.pdf`) or TXT (`.txt`)
✅ File must be ≤ 10 MB
✅ File must contain valid content
✅ File must not be password-protected (PDF)
✅ File must not be corrupted

### What Gets Extracted

📄 **PDF Files:**

- All text content from all pages
- Returns plain text (no formatting)
- ~111,000 characters from 239 pages tested

📝 **TXT Files:**

- All content as UTF-8 text
- Preserves line breaks
- No size limit on content (within 10MB file size)

---

**Last Updated:** November 7, 2025  
**Status:** Production Ready ✅  
**Files:** PDF & TXT only (10 MB max)
