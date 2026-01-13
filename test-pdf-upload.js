#!/usr/bin/env node

// Test PDF upload to debug the issue
const fs = require('fs');
const path = require('path');

async function testPDFUpload() {
  // Find an existing PDF in uploads directory
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  const files = fs.readdirSync(uploadsDir);
  const pdfFile = files.find(f => f.endsWith('.pdf'));
  
  if (!pdfFile) {
    console.error('No PDF file found in uploads directory');
    process.exit(1);
  }
  
  console.log(`Testing upload with existing PDF: ${pdfFile}`);
  const pdfPath = path.join(uploadsDir, pdfFile);
  const fileBuffer = fs.readFileSync(pdfPath);
  
  // Create FormData
  const FormData = require('form-data');
  const formData = new FormData();
  
  // Create a Blob-like object
  const blob = new Blob([fileBuffer], { type: 'application/pdf' });
  formData.append('file', fileBuffer, {
    filename: 'test.pdf',
    contentType: 'application/pdf'
  });
  
  try {
    const response = await fetch('http://localhost:3000/api/files/upload', {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Upload successful!');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Upload failed!');
      console.log('Status:', response.status);
      console.log('Error:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testPDFUpload();
