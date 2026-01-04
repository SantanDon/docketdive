/**
 * Verify Legislation Downloads
 * 
 * Check if required legislation files are present and valid.
 * Shows download status and provides next steps.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LEGISLATION_DIR = path.join(__dirname, '../documents/legislation');

interface RequiredAct {
  fileName: string;
  minSizeKB: number;
  tier: number;
}

const REQUIRED_ACTS: RequiredAct[] = [
  { fileName: 'Constitution_of_RSA_1996.pdf', minSizeKB: 100, tier: 1 },
  { fileName: 'Labour_Relations_Act_1995.pdf', minSizeKB: 100, tier: 1 },
  { fileName: 'Basic_Conditions_Employment_Act_1997.pdf', minSizeKB: 50, tier: 1 },
  { fileName: 'Bills_of_Exchange_Act_1964.pdf', minSizeKB: 50, tier: 1 },
  { fileName: 'Employment_Equity_Act_1998.pdf', minSizeKB: 50, tier: 2 },
  { fileName: 'POPIA_2000.pdf', minSizeKB: 100, tier: 2 },
  { fileName: 'Succession_Act_1957.pdf', minSizeKB: 50, tier: 2 },
  { fileName: 'Promotion_Access_Courts_Act_1997.pdf', minSizeKB: 50, tier: 2 },
];

function verifyLegislation() {
  console.log('\n📋 Legislation Verification Report\n');
  console.log('='.repeat(80));

  if (!fs.existsSync(LEGISLATION_DIR)) {
    console.log(`❌ Legislation folder not found: ${LEGISLATION_DIR}`);
    console.log(`\n📝 Create it with:\n   mkdir -p documents/legislation\n`);
    return false;
  }

  const files = fs.readdirSync(LEGISLATION_DIR);
  console.log(`📂 Folder: ${LEGISLATION_DIR}`);
  console.log(`📄 Files found: ${files.length}\n`);

  let tier1Found = 0;
  let tier2Found = 0;
  let issues = 0;
  const found: RequiredAct[] = [];

  for (const act of REQUIRED_ACTS) {
    const filePath = path.join(LEGISLATION_DIR, act.fileName);
    const exists = fs.existsSync(filePath);
    
    if (exists) {
      const stats = fs.statSync(filePath);
      const sizeKB = stats.size / 1024;
      const status = sizeKB >= act.minSizeKB ? '✅' : '⚠️';

      console.log(`${status} ${act.fileName}`);
      console.log(`   Size: ${sizeKB.toFixed(2)} KB (min: ${act.minSizeKB} KB)`);

      if (sizeKB < act.minSizeKB) {
        console.log(`   ⚠️  File seems too small, may be corrupted`);
        issues++;
      }

      found.push(act);
      if (act.tier === 1) tier1Found++;
      if (act.tier === 2) tier2Found++;
    } else {
      console.log(`❌ ${act.fileName} (missing)`);
      issues++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 Summary\n');
  console.log(`   Tier 1 Acts (Critical): ${tier1Found}/4`);
  console.log(`   Tier 2 Acts (Important): ${tier2Found}/4`);
  console.log(`   Total Found: ${found.length}/${REQUIRED_ACTS.length}`);
  
  if (issues === 0) {
    console.log('\n✅ All required legislation present!\n');
    console.log('🚀 Next steps:\n');
    console.log('   npm run ingest-legislation    # Process the acts');
    console.log('   npm run reembed-docs          # Generate embeddings');
    console.log('   npm run test:comprehensive    # Test vector search\n');
    return true;
  } else if (tier1Found >= 3) {
    console.log(`\n⚠️  Missing ${REQUIRED_ACTS.length - found.length} acts`);
    console.log('   You can proceed with Phase 3, but coverage will be limited.\n');
    console.log('📝 Missing acts:\n');
    for (const act of REQUIRED_ACTS) {
      if (!found.includes(act)) {
        console.log(`   - ${act.fileName}`);
      }
    }
    console.log('\n🚀 Proceed with:\n');
    console.log('   npm run ingest-legislation    # Process available acts\n');
    return true;
  } else {
    console.log(`\n❌ Not enough acts downloaded (only ${tier1Found}/4 Tier 1 acts)`);
    console.log('\n📝 Download missing acts:\n');
    console.log('   npm run download-legislation\n');
    console.log('   Or manually from: https://www.gov.za/documents/acts\n');
    return false;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = verifyLegislation();
  process.exit(result ? 0 : 1);
}

export { verifyLegislation };
