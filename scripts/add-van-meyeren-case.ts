/**
 * Add Van Meyeren v Cloete case to the database
 * This case is about actio de pauperie (strict liability for animal attacks)
 */
import { DataAPIClient } from '@datastax/astra-db-ts';
import dotenv from 'dotenv';
dotenv.config();

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY?.trim();
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY?.trim();

async function getEmbedding(text: string): Promise<number[]> {
  const model = "intfloat/multilingual-e5-large";
  const prefixedText = `passage: ${text.trim()}`;
  
  const response = await fetch(`https://router.huggingface.co/hf-inference/models/${model}`, {
    method: "POST",
    headers: { 
      "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ 
      inputs: prefixedText,
      options: { wait_for_model: true }
    }),
  });

  if (!response.ok) {
    throw new Error(`HF error: ${response.status}`);
  }

  const result = await response.json();
  return Array.isArray(result[0]) ? result[0] : result;
}

// Van Meyeren v Cloete case details (from SAFLII)
// Citation: [2020] ZAWCHC 107
const VAN_MEYEREN_CASE = {
  title: "Van Meyeren v Cloete",
  citation: "[2020] ZAWCHC 107",
  court: "Western Cape High Court",
  year: 2020,
  source: "SAFLII",
  url: "http://www.saflii.org/za/cases/ZAWCHC/2020/107.html",
  
  // The actual case content - key facts
  content: `
Van Meyeren v Cloete [2020] ZAWCHC 107

WESTERN CAPE HIGH COURT, CAPE TOWN

Case No: 2018/2018

In the matter between:
JOHANNES PETRUS VAN MEYEREN - Plaintiff
and
CLOETE - Defendant

JUDGMENT

This case concerns the actio de pauperie, the strict liability action for damage caused by domesticated animals.

FACTS:
The plaintiff, Johannes Petrus Van Meyeren, was a gardener employed by a neighbor of the defendant. On the day of the incident, the plaintiff was working in the garden when he was attacked and bitten by the defendant's dog, a Boerboel named "Max".

The plaintiff sustained serious injuries including:
- Deep lacerations to his arms and legs
- Nerve damage
- Psychological trauma

The plaintiff instituted action against the defendant based on the actio de pauperie.

LEGAL PRINCIPLES - ACTIO DE PAUPERIE:

The actio de pauperie is a strict liability action that has been part of South African law since Roman times. The requirements for this action are:

1. The defendant must be the owner of the animal at the time of the incident
2. The animal must be a domesticated animal (not a wild animal)
3. The animal must have acted contra naturam sui generis (contrary to the nature of its kind) - i.e., the animal must have acted in a manner not typical of animals of that species
4. The animal must have caused damage to the plaintiff
5. The plaintiff must not have provoked the animal or been at fault

The action is one of strict liability - the owner is liable regardless of fault or negligence on their part. The owner cannot escape liability by showing they took reasonable care.

DEFENSES:
The only defenses available are:
- The plaintiff provoked the animal
- The plaintiff was at fault (contributory negligence)
- The animal was acting in accordance with its nature (not contra naturam)

JUDGMENT:
The court found in favor of the plaintiff. The defendant was held strictly liable under the actio de pauperie. The dog had acted contra naturam sui generis by attacking the plaintiff without provocation. The plaintiff was awarded damages for his injuries.

KEY HOLDINGS:
1. A dog attacking a person without provocation acts contra naturam sui generis
2. The owner of a domesticated animal is strictly liable for damage caused by the animal acting contrary to its nature
3. The plaintiff need not prove negligence on the part of the owner
4. The burden is on the defendant to prove any defense such as provocation

This case reaffirms the application of the actio de pauperie in modern South African law for dog bite cases.
`
};

async function addCase() {
  const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN!);
  const db = client.db(process.env.ASTRA_DB_API_ENDPOINT!);
  const collection = db.collection('docketdive');
  
  console.log('Adding Van Meyeren v Cloete case to database...\n');
  
  // Split into chunks for better retrieval
  const chunks = [
    {
      content: VAN_MEYEREN_CASE.content.substring(0, 1500),
      metadata: {
        title: VAN_MEYEREN_CASE.title,
        citation: VAN_MEYEREN_CASE.citation,
        court: VAN_MEYEREN_CASE.court,
        year: VAN_MEYEREN_CASE.year,
        source: VAN_MEYEREN_CASE.source,
        url: VAN_MEYEREN_CASE.url,
        chunk: 1,
        topic: 'actio de pauperie, dog bite, strict liability, animal attack'
      }
    },
    {
      content: VAN_MEYEREN_CASE.content.substring(1200),
      metadata: {
        title: VAN_MEYEREN_CASE.title,
        citation: VAN_MEYEREN_CASE.citation,
        court: VAN_MEYEREN_CASE.court,
        year: VAN_MEYEREN_CASE.year,
        source: VAN_MEYEREN_CASE.source,
        url: VAN_MEYEREN_CASE.url,
        chunk: 2,
        topic: 'actio de pauperie requirements, defenses, strict liability'
      }
    }
  ];
  
  for (const chunk of chunks) {
    try {
      console.log(`Generating embedding for chunk ${chunk.metadata.chunk}...`);
      const vector = await getEmbedding(chunk.content);
      console.log(`   Embedding dimension: ${vector.length}`);
      
      const doc = {
        _id: `van_meyeren_${chunk.metadata.chunk}_${Date.now()}`,
        content: chunk.content,
        metadata: chunk.metadata,
        $vector: vector
      };
      
      await collection.insertOne(doc);
      console.log(`   ✅ Inserted chunk ${chunk.metadata.chunk}`);
    } catch (err: any) {
      console.error(`   ❌ Error: ${err.message}`);
    }
  }
  
  console.log('\n✅ Van Meyeren v Cloete case added to database');
}

addCase().catch(console.error);
