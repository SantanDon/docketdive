import type { GlossaryTerm } from '@/types/document-processing';

/**
 * South African Legal Glossary
 * Contains common legal terms, Latin phrases, and SA-specific terminology
 */
export const SA_LEGAL_TERMS: GlossaryTerm[] = [
  // ============================================
  // Latin Legal Terms
  // ============================================
  {
    term: "prima facie",
    definition: "At first appearance; on the face of it. Evidence that is sufficient to establish a fact unless rebutted.",
    category: "latin",
    source: "Common law"
  },
  {
    term: "res judicata",
    definition: "A matter already judged. A case that has been decided and cannot be relitigated between the same parties.",
    category: "latin",
    source: "Common law"
  },
  {
    term: "stare decisis",
    definition: "To stand by decided matters. The doctrine of following legal precedent.",
    category: "latin",
    source: "Common law"
  },
  {
    term: "in limine",
    definition: "At the threshold. A preliminary motion or objection raised before trial.",
    category: "latin",
    source: "Common law"
  },
  {
    term: "ex parte",
    definition: "From one side only. A proceeding brought by one party without the other party present.",
    category: "latin",
    source: "Common law"
  },
  {
    term: "ad hoc",
    definition: "For this purpose. Something created or done for a specific purpose.",
    category: "latin",
    source: "Common law"
  },
  {
    term: "bona fide",
    definition: "In good faith. Genuine, without fraud or deceit.",
    category: "latin",
    source: "Common law"
  },
  {
    term: "de facto",
    definition: "In fact. Something that exists in reality, even if not legally recognized.",
    category: "latin",
    source: "Common law"
  },
  {
    term: "de jure",
    definition: "By law. Something that exists by legal right or authority.",
    category: "latin",
    source: "Common law"
  },
  {
    term: "inter alia",
    definition: "Among other things. Used to indicate that what follows is not exhaustive.",
    category: "latin",
    source: "Common law"
  },
  {
    term: "ipso facto",
    definition: "By the fact itself. Something that follows as a direct consequence.",
    category: "latin",
    source: "Common law"
  },
  {
    term: "mala fide",
    definition: "In bad faith. With intent to deceive or defraud.",
    category: "latin",
    source: "Common law"
  },
  {
    term: "mutatis mutandis",
    definition: "With necessary changes. Applying something with appropriate modifications.",
    category: "latin",
    source: "Common law"
  },
  {
    term: "per se",
    definition: "By itself. Intrinsically or inherently.",
    category: "latin",
    source: "Common law"
  },
  {
    term: "pro rata",
    definition: "In proportion. Calculated according to a particular rate or share.",
    category: "latin",
    source: "Common law"
  },
  {
    term: "quid pro quo",
    definition: "Something for something. An exchange of goods or services.",
    category: "latin",
    source: "Common law"
  },
  {
    term: "sine die",
    definition: "Without a day. Adjourned indefinitely without setting a date.",
    category: "latin",
    source: "Common law"
  },
  {
    term: "ultra vires",
    definition: "Beyond the powers. An act that exceeds legal authority.",
    category: "latin",
    source: "Common law"
  },
  {
    term: "vis major",
    definition: "Superior force. An unforeseeable natural event (force majeure).",
    category: "latin",
    source: "Common law"
  },
  {
    term: "volenti non fit injuria",
    definition: "To a willing person, no injury is done. Consent to risk negates liability.",
    category: "latin",
    source: "Common law"
  },
  {
    term: "locus standi",
    definition: "Place of standing. The right to bring a legal action or be heard in court.",
    category: "latin",
    source: "Common law"
  },
  {
    term: "obiter dictum",
    definition: "A remark in passing. A judge's comment not essential to the decision.",
    category: "latin",
    source: "Common law"
  },
  {
    term: "ratio decidendi",
    definition: "The reason for deciding. The legal principle on which a judgment is based.",
    category: "latin",
    source: "Common law"
  },
  {
    term: "sub judice",
    definition: "Under judgment. A case currently before the court.",
    category: "latin",
    source: "Common law"
  },
  {
    term: "amicus curiae",
    definition: "Friend of the court. A person who assists the court with information.",
    category: "latin",
    source: "Common law"
  },

  // ============================================
  // South African Procedural Terms
  // ============================================
  {
    term: "interdict",
    definition: "A court order prohibiting or compelling specific action. The South African equivalent of an injunction.",
    category: "procedural",
    source: "SA Common Law"
  },
  {
    term: "summons",
    definition: "A document initiating civil proceedings, particularly in the Magistrate's Court.",
    category: "procedural",
    source: "Magistrates' Courts Act"
  },
  {
    term: "particulars of claim",
    definition: "A detailed statement setting out the plaintiff's case and the relief sought.",
    category: "procedural",
    source: "Uniform Rules of Court"
  },
  {
    term: "plea",
    definition: "The defendant's formal response to the plaintiff's claim.",
    category: "procedural",
    source: "Uniform Rules of Court"
  },
  {
    term: "replication",
    definition: "The plaintiff's response to the defendant's plea.",
    category: "procedural",
    source: "Uniform Rules of Court"
  },
  {
    term: "notice of motion",
    definition: "A document initiating motion proceedings, setting out the relief sought.",
    category: "procedural",
    source: "Uniform Rules of Court"
  },
  {
    term: "founding affidavit",
    definition: "The initial sworn statement supporting a motion application.",
    category: "procedural",
    source: "Uniform Rules of Court"
  },
  {
    term: "answering affidavit",
    definition: "The respondent's sworn statement in response to a motion application.",
    category: "procedural",
    source: "Uniform Rules of Court"
  },
  {
    term: "replying affidavit",
    definition: "The applicant's sworn response to the answering affidavit.",
    category: "procedural",
    source: "Uniform Rules of Court"
  },
  {
    term: "rule nisi",
    definition: "A provisional court order that becomes final unless cause is shown otherwise.",
    category: "procedural",
    source: "SA Common Law"
  },
  {
    term: "absolution from the instance",
    definition: "A judgment dismissing the case without deciding on the merits, allowing re-litigation.",
    category: "procedural",
    source: "SA Common Law"
  },
  {
    term: "exception",
    definition: "A procedural objection that the pleading is defective in law.",
    category: "procedural",
    source: "Uniform Rules of Court"
  },
  {
    term: "special plea",
    definition: "A defence raising a point of law without addressing the merits.",
    category: "procedural",
    source: "Uniform Rules of Court"
  },
  {
    term: "discovery",
    definition: "The process of disclosing relevant documents to the opposing party.",
    category: "procedural",
    source: "Uniform Rules of Court"
  },
  {
    term: "interrogatories",
    definition: "Written questions that must be answered under oath by the opposing party.",
    category: "procedural",
    source: "Uniform Rules of Court"
  },

  // ============================================
  // Substantive Legal Terms
  // ============================================
  {
    term: "delict",
    definition: "A civil wrong causing harm, similar to tort in common law systems.",
    category: "substantive",
    source: "SA Common Law"
  },
  {
    term: "aquilian liability",
    definition: "Liability for negligent damage to property or pure economic loss.",
    category: "substantive",
    source: "Lex Aquilia"
  },
  {
    term: "actio injuriarum",
    definition: "An action for injury to personality rights (dignity, privacy, reputation).",
    category: "substantive",
    source: "Roman-Dutch Law"
  },
  {
    term: "cession",
    definition: "The transfer of a right from one person (cedent) to another (cessionary).",
    category: "substantive",
    source: "SA Common Law"
  },
  {
    term: "suretyship",
    definition: "A contract where one person guarantees another's debt or obligation.",
    category: "substantive",
    source: "SA Common Law"
  },
  {
    term: "tacit hypothec",
    definition: "A security right arising by operation of law, such as a landlord's hypothec.",
    category: "substantive",
    source: "SA Common Law"
  },
  {
    term: "rei vindicatio",
    definition: "An action by an owner to recover possession of property.",
    category: "substantive",
    source: "Roman-Dutch Law"
  },
  {
    term: "mandament van spolie",
    definition: "A remedy to restore possession to someone unlawfully dispossessed.",
    category: "substantive",
    source: "Roman-Dutch Law"
  },
  {
    term: "enrichment",
    definition: "Unjustified enrichment at another's expense, giving rise to a claim.",
    category: "substantive",
    source: "SA Common Law"
  },
  {
    term: "estoppel",
    definition: "A doctrine preventing a party from denying facts they previously represented.",
    category: "substantive",
    source: "Common Law"
  },
];

// SA Case Citation Patterns (regex)
export const SA_CITATION_PATTERNS = [
  // Standard: 2023 (1) SA 123 (CC)
  /\d{4}\s*\(\d+\)\s*SA\s*\d+\s*\([A-Z]+\)/g,
  // BCLR: 2023 (1) BCLR 123 (CC)
  /\d{4}\s*\(\d+\)\s*BCLR\s*\d+\s*\([A-Z]+\)/g,
  // All SA: 2023 (1) All SA 123 (SCA)
  /\d{4}\s*\(\d+\)\s*All\s*SA\s*\d+\s*\([A-Z]+\)/g,
  // ZASCA format: [2023] ZASCA 123
  /\[\d{4}\]\s*ZA[A-Z]+\s*\d+/g,
  // Older format: S v Smith 2020 (1) SACR 123 (SCA)
  /\d{4}\s*\(\d+\)\s*SACR\s*\d+\s*\([A-Z]+\)/g,
];

// Statute reference patterns
export const STATUTE_PATTERNS = [
  // Section X of the Act
  /[Ss]ection\s+\d+[A-Za-z]?(?:\s*\(\d+\))*\s+of\s+(?:the\s+)?[\w\s]+Act/g,
  // s X of Act
  /s\s*\d+[A-Za-z]?(?:\s*\(\d+\))*\s+of\s+(?:the\s+)?[\w\s]+Act/g,
  // Act No. X of Year
  /Act\s+(?:No\.?\s*)?\d+\s+of\s+\d{4}/g,
  // Constitution references
  /[Ss]ection\s+\d+\s+of\s+the\s+Constitution/g,
];

// Party role keywords
export const PARTY_ROLE_KEYWORDS = {
  plaintiff: ['plaintiff', 'claimant'],
  defendant: ['defendant', 'respondent in reconvention'],
  applicant: ['applicant', 'petitioner'],
  respondent: ['respondent', 'opponent'],
  appellant: ['appellant'],
  other: ['third party', 'intervening party', 'amicus curiae'],
};

// Court abbreviations
export const SA_COURTS: Record<string, string> = {
  'CC': 'Constitutional Court',
  'SCA': 'Supreme Court of Appeal',
  'GP': 'Gauteng Division, Pretoria',
  'GJ': 'Gauteng Local Division, Johannesburg',
  'WCC': 'Western Cape Division',
  'KZD': 'KwaZulu-Natal Division',
  'ECP': 'Eastern Cape Division',
  'FB': 'Free State Division',
  'NC': 'Northern Cape Division',
  'LP': 'Limpopo Division',
  'NWM': 'North West Division',
  'MP': 'Mpumalanga Division',
  'LAC': 'Labour Appeal Court',
  'LC': 'Labour Court',
  'LCC': 'Land Claims Court',
  'CCC': 'Competition Appeal Court',
};

export default SA_LEGAL_TERMS;
