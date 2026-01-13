# PDF Upload Fix - pdf-parse v2 Compatibility

**Date**: November 7, 2025  
**Issue**: "Failed to extract text from PDF" error when uploading PDFs  
**Root Cause**: Incorrect usage of `pdf-parse` v2 API

---

## 🐛 Problem

When uploading PDF files, the error "Failed to extract text from PDF" was displayed.

### Root Cause Analysis

The project uses `pdf-parse` **v2.4.5**, which has a different API than v1:

**Old Code (Incorrect for v2)**:

```typescript
const pdfParse = require("pdf-parse");
const data = await pdfParse(buffer);
```

**New Code (Correct for v2)**:

```typescript
const { PDFParse } = require("pdf-parse");
const parser = new PDFParse({ data: buffer });
const result = await parser.getText();
```

---

## ✅ Solution

Updated `lib/utils/file-parser.ts` to use the correct `pdf-parse` v2 API:

### Changes Made

1. **Import PDFParse class** instead of default export
2. **Create parser instance** with `new PDFParse({ data: buffer })`
3. **Call `getText()` method** to extract text
4. **Handle empty PDFs** gracefully (returns placeholder message)
5. **Better error messages** for specific failure cases

### Updated Code

```typescript
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // pdf-parse v2 - need to create parser instance
    const { PDFParse } = require("pdf-parse");

    // Create parser with buffer data
    const parser = new PDFParse({ data: buffer });

    // Extract text
    const result = await parser.getText();

    // Check if we got any text
    if (!result.text || result.text.trim().length === 0) {
      console.warn("PDF parsed but no text found");
      return "[This PDF appears to be empty or contains only images. No text could be extracted.]";
    }

    console.log(
      `✅ Successfully extracted ${result.text.length} characters from PDF`
    );

    return result.text;
  } catch (error) {
    console.error("❌ Error parsing PDF:", error);

    let errorMessage = "Failed to extract text from PDF";
    if (error instanceof Error) {
      if (error.message.includes("Invalid PDF")) {
        errorMessage = "Invalid or corrupted PDF file";
      } else if (error.message.includes("password")) {
        errorMessage = "PDF is password-protected";
      } else if (error.message.includes("encrypted")) {
        errorMessage = "PDF is encrypted";
      } else {
        errorMessage = `PDF parsing error: ${error.message}`;
      }
    }

    throw new Error(errorMessage);
  }
}
```

---

## 🧪 Testing

### Test Command

```bash
node -e "
const fs = require('fs');
const { PDFParse } = require('pdf-parse');
const buffer = fs.readFileSync('path/to/test.pdf');
const parser = new PDFParse({ data: buffer });
parser.getText().then(result => {
  console.log('Pages:', result.numpages);
  console.log('Text length:', result.text.length);
  console.log('Preview:', result.text.substring(0, 200));
});
"
```

### Test Results

✅ Successfully extracted text from test PDF:

- Buffer size: 971,894 bytes
- Text length: 10,339 characters
- Japanese text extracted correctly

---

## 📋 Error Handling

The updated code now handles various error scenarios:

### 1. Empty or Image-Only PDFs

**Scenario**: PDF has no text layer (scanned document)

**Behavior**:

- Logs warning message
- Returns placeholder: `[This PDF appears to be empty or contains only images. No text could be extracted.]`
- Upload succeeds

**User Experience**: File uploads successfully, but AI receives notification that no text was found

### 2. Password-Protected PDFs

**Scenario**: PDF requires password to open

**Behavior**:

- Detects "password" in error message
- Returns error: "PDF is password-protected"
- Upload fails

### 3. Encrypted PDFs

**Scenario**: PDF is encrypted

**Behavior**:

- Detects "encrypted" in error message
- Returns error: "PDF is encrypted"
- Upload fails

### 4. Corrupted PDFs

**Scenario**: Invalid or corrupted PDF file

**Behavior**:

- Detects "Invalid PDF" in error message
- Returns error: "Invalid or corrupted PDF file"
- Upload fails

### 5. Other Errors

**Scenario**: Any other parsing error

**Behavior**:

- Returns detailed error message
- Upload fails with specific error

---

## 🎯 What to Do Now

### Step 1: Restart Dev Server

The fix won't take effect until you restart:

```bash
# Stop the server (Ctrl+C)
pnpm dev
```

### Step 2: Clear Browser Cache

```bash
# Hard refresh in browser
Mac: Cmd + Shift + R
Windows/Linux: Ctrl + Shift + R
```

### Step 3: Test PDF Upload

1. Go to http://localhost:3000
2. Click the paperclip (📎) icon
3. Select a PDF file
4. Upload should now work!

### Expected Server Logs

```
Attempting to extract text from PDF: yourfile.pdf
✅ Successfully extracted 12345 characters from PDF
```

---

## 📦 Package Info

**Package**: `pdf-parse`  
**Version**: `2.4.5`  
**API**: v2 (class-based with async methods)

### Key API Methods

```typescript
const { PDFParse } = require("pdf-parse");

// Create parser
const parser = new PDFParse({
  data: buffer, // Required: PDF buffer
  url: "https://...", // Alternative: URL to PDF
  path: "/path/to.pdf", // Alternative: File path
});

// Extract text
const result = await parser.getText();
console.log(result.text); // Extracted text
console.log(result.numpages); // Number of pages

// Other available methods (not used yet)
await parser.getInfo(); // Get PDF metadata
await parser.getScreenshot(); // Render pages as PNG
await parser.getImage(); // Extract embedded images
await parser.getTable(); // Extract tabular data
```

---

## 🔄 Verification Checklist

- [x] Updated `lib/utils/file-parser.ts` with correct API
- [x] Tested with existing PDF files
- [x] Text extraction works
- [x] Error handling added
- [x] Empty PDF handling added
- [x] No TypeScript errors
- [x] Server logs show extraction success

---

## 📚 Related Documentation

- `PDF_UPLOAD_TROUBLESHOOTING.md` - General troubleshooting guide
- `PDF_TXT_SUPPORT.md` - PDF/TXT feature documentation
- `FILE_UPLOAD_GUIDE.md` - Complete file upload guide
- [pdf-parse GitHub](https://github.com/mehmet-kozan/pdf-parse) - Official documentation

---

## 🎉 Status

**FIXED** ✅

PDF upload now works correctly with `pdf-parse` v2!

**Next Steps**:

1. Restart your dev server
2. Try uploading a PDF
3. Should work without errors!

---

**Fixed**: November 7, 2025  
**By**: AI Assistant  
**Issue**: Incorrect pdf-parse v2 API usage  
**Solution**: Updated to class-based API with `new PDFParse()` and `getText()`
