import dotenv from 'dotenv';
dotenv.config();

import { retrieveRelevantDocuments, buildContext } from '../app/api/utils/rag';

async function debug() {
  const query = 'In the leading actio de pauperie case, what breed was the cat that attacked the plaintiff?';
  console.log('Query:', query);
  
  const docs = await retrieveRelevantDocuments(query, '');
  console.log('\n--- Retrieved Documents ---');
  console.log('Count:', docs.length);
  
  const sourceContent = docs.map(d => (d.content || '').toLowerCase()).join(' ');
  
  console.log('\n--- Content Analysis ---');
  console.log('Contains "dog":', sourceContent.includes('dog'));
  console.log('Contains "cat":', sourceContent.includes('cat'));
  console.log('Contains "boerboel":', sourceContent.includes('boerboel'));
  console.log('Contains "max":', sourceContent.includes('max'));
  console.log('Contains "western cape":', sourceContent.includes('western cape'));
  console.log('Contains "2020":', sourceContent.includes('2020'));
  
  console.log('\n--- First Doc Content Preview ---');
  if (docs[0]) {
    console.log(docs[0].content?.substring(0, 1000));
  }
}

debug().catch(console.error);
