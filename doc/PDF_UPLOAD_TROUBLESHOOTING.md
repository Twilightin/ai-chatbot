# PDF Upload Troubleshooting Guide

## Issue: "The request couldn't be processed" Error When Uploading PDF

### 🔍 Diagnosis Steps

The error "The request couldn't be processed. Please check your input and try again." can occur at different stages:

1. **File Upload Stage** - Error uploading the file to `/api/files/upload`
2. **Message Submission Stage** - Error when sending the chat message with the file attachment

### ✅ Recent Changes Made

1. **Added Better Error Logging**:

   - File upload route now logs detailed errors
   - Chat API now logs schema validation errors
   - Frontend logs upload errors to console

2. **Validation Updates**:

   - Removed image support from schema (only PDF and TXT allowed)
   - Made PDF text extraction required (not optional)
   - TXT file reading now required

3. **Error Handling**:
   - PDF text extraction failures return proper error
   - TXT file reading failures return proper error
   - Schema validation errors logged with details

---

## 🐛 How to Debug

### Step 1: Check Browser Console

1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for error messages like:
   - `Upload error: ...`
   - `Upload exception: ...`
   - `Schema validation failed: ...`

### Step 2: Check Server Logs

Look in your terminal where `pnpm dev` is running for:

```
❌ PDF text extraction failed: ...
❌ TXT file reading failed: ...
❌ Schema validation failed: ...
Validation errors: [...]
```

### Step 3: Check Network Tab

1. Open Developer Tools (F12)
2. Go to Network tab
3. Upload a PDF
4. Look for the `/api/files/upload` request
5. Check Response:
   - Status code (should be 200 for success)
   - Response body (should contain `url`, `contentType`, `extractedText`)

---

## 🔧 Common Issues & Solutions

### Issue 1: PDF Text Extraction Fails

**Symptoms**:

- Server logs: `❌ PDF text extraction failed: ...`
- Upload fails with 500 error

**Causes**:

- Corrupted PDF file
- Encrypted/password-protected PDF
- PDF with only images (no text layer)
- `pdf-parse` package issues

**Solutions**:

1. **Test with a simple PDF**:

   ```bash
   # Create a test PDF with text
   echo "This is a test PDF content" > test.txt
   # Convert to PDF (requires tools like `ps2pdf` or online converter)
   ```

2. **Check pdf-parse installation**:

   ```bash
   pnpm list pdf-parse
   # Should show: pdf-parse@2.4.5 or similar
   ```

3. **Reinstall pdf-parse**:

   ```bash
   pnpm remove pdf-parse
   pnpm add pdf-parse
   ```

4. **Try a different PDF**:
   - Use a text-based PDF (not scanned images)
   - Ensure PDF is not encrypted
   - Try a smaller PDF first

### Issue 2: Schema Validation Fails

**Symptoms**:

- Error: "The request couldn't be processed"
- Server logs: `❌ Schema validation failed`
- Validation errors in console

**Causes**:

- File part has wrong mediaType
- Missing required fields (`extractedText`)
- Invalid data format

**Solutions**:

1. **Check the validation error details** in server logs:

   ```json
   {
     "path": ["message", "parts", 0, "mediaType"],
     "message": "Invalid enum value..."
   }
   ```

2. **Clear browser cache**:

   - Old frontend code might be cached
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

3. **Restart dev server**:
   ```bash
   # Stop the server (Ctrl+C)
   pnpm dev
   ```

### Issue 3: File Upload Succeeds but Message Fails

**Symptoms**:

- File appears in `/public/uploads/`
- But chat message fails to send

**Causes**:

- File uploaded without `extractedText`
- Schema validation fails on message submission

**Solutions**:

1. **Check uploaded file data**:

   - Open browser console
   - Look for the upload response
   - Verify `extractedText` field exists

2. **Check file in uploads directory**:

   ```bash
   ls -lh public/uploads/
   # Should see your PDF file
   ```

3. **Test text extraction manually**:
   ```bash
   node -e "
   const fs = require('fs');
   const pdfParse = require('pdf-parse');
   const buffer = fs.readFileSync('public/uploads/YOUR_FILE.pdf');
   pdfParse(buffer).then(data => {
     console.log('Text length:', data.text.length);
     console.log('First 100 chars:', data.text.substring(0, 100));
   });
   "
   ```

---

## 📊 Expected Behavior

### Successful PDF Upload Flow:

1. User selects PDF file
2. File is uploaded to `/api/files/upload`
3. Server:
   - Validates file type (PDF or TXT)
   - Saves file to `/public/uploads/`
   - Extracts text from PDF
   - Returns response with `extractedText`
4. Frontend receives file data
5. User sends message
6. Chat API:
   - Validates message schema
   - Converts file part with `extractedText` to text part
   - Sends to LLM
7. LLM processes the text content

### Expected Response from Upload API:

```json
{
  "url": "/uploads/abc123.pdf",
  "pathname": "abc123.pdf",
  "contentType": "application/pdf",
  "contentDisposition": "attachment; filename=\"document.pdf\"",
  "name": "document.pdf",
  "extractedText": "This is the text content extracted from the PDF file..."
}
```

---

## 🧪 Manual Testing

### Test 1: Upload a Simple TXT File

1. Create `test.txt`:

   ```bash
   echo "Hello, this is a test file!" > test.txt
   ```

2. Upload in chat UI
3. Should succeed immediately
4. Check console for: `✅ Read ... characters from TXT`

### Test 2: Upload a PDF

1. Use any text-based PDF
2. Upload in chat UI
3. Check server logs for:
   ```
   Attempting to extract text from PDF: yourfile.pdf
   ✅ Extracted XXX characters from PDF: yourfile.pdf
   ```

### Test 3: Send Message with PDF

1. Upload PDF
2. Type a message like: "Summarize this document"
3. Send message
4. Should work without errors
5. AI should receive the extracted text

---

## 🔄 Reset Everything

If nothing works, try a complete reset:

```bash
# 1. Stop the dev server (Ctrl+C)

# 2. Clear uploads
rm -rf public/uploads/*

# 3. Reinstall dependencies
rm -rf node_modules
pnpm install

# 4. Clear Next.js cache
rm -rf .next

# 5. Restart dev server
pnpm dev

# 6. Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
```

---

## 📝 Collecting Debug Info

If the issue persists, collect this information:

1. **Browser Console Output**:

   - Any error messages
   - Network tab responses

2. **Server Logs**:

   - Terminal output when uploading
   - Any error stack traces

3. **File Info**:

   ```bash
   # Check uploaded file
   ls -lh public/uploads/
   file public/uploads/YOUR_FILE.pdf
   ```

4. **Package Versions**:

   ```bash
   pnpm list pdf-parse
   node --version
   pnpm --version
   ```

5. **Test PDF Info**:
   - File size
   - PDF version
   - Whether it's text-based or scanned
   - Whether it's encrypted

---

## ✅ Verification Checklist

- [ ] `pdf-parse` package installed (v2.4.5 or later)
- [ ] `/public/uploads/` directory exists
- [ ] Dev server running without errors
- [ ] Browser cache cleared / hard refresh done
- [ ] PDF file is text-based (not just images)
- [ ] PDF file is not encrypted
- [ ] PDF file is under 10 MB
- [ ] Server logs show text extraction success
- [ ] Upload API returns `extractedText` field
- [ ] No schema validation errors in server logs

---

## 🎯 Next Steps

1. **Follow diagnosis steps above**
2. **Check browser console AND server logs**
3. **Try with a simple TXT file first**
4. **Then try with a simple text-based PDF**
5. **Collect debug info if issue persists**

---

**Created**: November 7, 2025  
**Last Updated**: After adding detailed error logging
