/**
 * Complete RAG Diagnostics Runner
 * Runs: Diagnosis → Re-embedding (if needed) → Comprehensive Tests
 */

import { spawn } from 'child_process';
import path from 'path';

function runCommand(cmd: string, args: string[], description: string): Promise<boolean> {
  return new Promise((resolve) => {
    console.log('\n' + '='.repeat(80));
    console.log(`🔧 ${description}`);
    console.log('='.repeat(80) + '\n');

    const process = spawn(cmd, args, {
      cwd: path.resolve(process.cwd()),
      stdio: 'inherit',
      shell: true
    });

    process.on('close', (code) => {
      resolve(code === 0);
    });

    process.on('error', (err) => {
      console.error(`Error: ${err.message}`);
      resolve(false);
    });
  });
}

async function runDiagnostics() {
  console.log('\n🚀 STARTING RAG PIPELINE DIAGNOSTICS\n');
  console.log('This will:');
  console.log('1. Check current vector embedding status');
  console.log('2. Re-embed documents if needed');
  console.log('3. Run comprehensive retrieval tests');
  console.log('4. Generate detailed report\n');

  // Step 1: Diagnose current state
  const diagnosisSuccess = await runCommand(
    'npx',
    ['tsx', 'scripts/diagnose-rag.ts'],
    'STEP 1: Running RAG Diagnostic'
  );

  if (!diagnosisSuccess) {
    console.error('\n❌ Diagnostics failed. Check environment variables.');
    process.exit(1);
  }

  // Step 2: Comprehensive tests
  const testSuccess = await runCommand(
    'npx',
    ['tsx', 'scripts/comprehensive-rag-test.ts'],
    'STEP 2: Running Comprehensive RAG Tests'
  );

  // Final report
  console.log('\n' + '='.repeat(80));
  console.log('📋 DIAGNOSTICS COMPLETE');
  console.log('='.repeat(80) + '\n');

  if (testSuccess) {
    console.log('✅ RAG PIPELINE HEALTHY');
    console.log('   Your knowledge base is properly embedded and searchable');
    console.log('   Follow-up questions should work with context awareness\n');
  } else {
    console.log('⚠️  SOME ISSUES DETECTED');
    console.log('   If vectors are missing:');
    console.log('   → npm run reembed-docs\n');
    console.log('   Then re-run:');
    console.log('   → npm run test:comprehensive\n');
  }

  console.log('Quick Test Commands:');
  console.log('  npm run test-rag              - Test vector search');
  console.log('  npm run test:comprehensive    - Full pipeline test');
  console.log('  npm run diagnose-rag          - Check health status');
  console.log('  npm run reembed-docs          - Re-embed all documents\n');

  process.exit(testSuccess ? 0 : 1);
}

runDiagnostics().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
