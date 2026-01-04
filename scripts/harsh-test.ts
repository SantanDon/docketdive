import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';

const BASE_URL = 'http://127.0.0.1:3000';
const SMATERIAL_DIR = path.join(process.cwd(), 'smaterial');

// Test Files
const FILES = {
  contract: 'Contract Law in South Africa (Louis F. van Huyssteen Catherine J. Maxwell) (Z-Library).pdf',
  succession: 'The Law of Succession in South Africa (Juanita Jamneck, C. Rautenbach, Mohamed Paleker etc.) (Z-Library).pdf',
  popia: 'Administration of Deceased Estates-ADDITIONAL CLASSNOTES.pdf' // Not a privacy policy, good for negative test
};

async function getPdfText(filename: string): Promise<string> {
  const filePath = path.join(SMATERIAL_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return '';
  }
  const dataBuffer = fs.readFileSync(filePath);
  try {
      const data = await pdf(dataBuffer);
      return data.text;
  } catch (e) {
      console.error(`Failed to parse PDF ${filename}:`, e);
      return '';
  }
}

async function testEndpoint(name: string, endpoint: string, payload: any, expectedStatus = 200) {
  console.log(`\n--- Testing ${name} ---`);
  console.log(`Payload size: ${JSON.stringify(payload).length} chars`);
  
  const start = Date.now();
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const duration = (Date.now() - start) / 1000;
    const isOk = res.status === expectedStatus;
    
    console.log(`Status: ${res.status} ${res.statusText}`);
    console.log(`Time: ${duration.toFixed(2)}s`);
    
    if (isOk) {
      const data = await res.json();
      // Basic validation based on tool
      if (name === 'Contract Analysis') {
           console.log(`Risk Score: ${data.analysis?.riskScore}`);
           console.log(`Type: ${data.analysis?.contractType}`);
      } else if (name === 'POPIA Check') {
           console.log(`Score: ${data.complianceScore}%`);
           console.log(`Type Confidence: ${data.typeConfidence}`);
      }
      return { name, duration, success: true };
    } else {
      console.error('Text:', await res.text());
      return { name, duration, success: false };
    }
  } catch (e: any) {
    const duration = (Date.now() - start) / 1000;
    console.error(`Error: ${e.message}`);
    return { name, duration, success: false };
  }
}

async function runTests() {
  console.log('Starting Harsh Validation...');
  
  // 1. Prepare Content
  console.log('Reading PDFs...');
  const contractText = await getPdfText(FILES.contract);
  const successionText = await getPdfText(FILES.succession);
  const popiaText = await getPdfText(FILES.popia);
  
  if (!contractText || !successionText || !popiaText) {
      console.error("Could not read all PDFs. Aborting.");
      return;
  }
  
  console.log(`Contract Text Length: ${contractText.length} chars`);
  
  const results = [];

  // 2. Contract Analysis Stress Test
  // Truncating to 15k chars to avoid absolute timeout if local LLM is slow, but large enough to stress.
  // The API truncates to 12k anyway.
  results.push(await testEndpoint(
    'Contract Analysis (Heavy)', 
    '/api/contract-analysis', 
    { content: contractText.substring(0, 50000), perspective: 'neutral', contractType: 'Service Agreement' }
  ));

  // 3. POPIA Check (Negative Test)
  // Sending a non-privacy policy
  results.push(await testEndpoint(
    'POPIA Check (Negative)', 
    '/api/popia', 
    { content: popiaText.substring(0, 20000) }
  ));

  // 4. Clause Auditor
  results.push(await testEndpoint(
    'Clause Auditor (Heavy)',
    '/api/audit',
    { content: successionText.substring(0, 30000) }
  ));

  // 5. Document Simplifier
  results.push(await testEndpoint(
    'Simplifier (Heavy)',
    '/api/simplify',
    { content: contractText.substring(0, 10000) }
  ));

  console.log('\n=== SUMMARY ===');
  console.table(results);
}

runTests();
