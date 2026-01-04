# Downloading South African Acts

This guide helps you download key South African legislation from gov.za for DocketDive's knowledge base.

## Quick Start

1. **Create the legislation folder** (if not already present):
   ```bash
   mkdir -p documents/legislation
   ```

2. **Download the key Acts** (see links below)

3. **Run the ingestion script**:
   ```bash
   npm run ingest-legislation
   ```

---

## Key Acts to Download

Focus on Acts relevant to Contract Law and Labour disputes (priority areas).

### Tier 1: Critical (Download First)

| Act | Year | Link | Relevance |
|-----|------|------|-----------|
| Constitution of the RSA | 1996 | [Link](https://www.gov.za/documents/constitution-republic-south-africa-1996-act-108-1996) | Constitutional foundation |
| Labour Relations Act | 1995 | [Link](https://www.gov.za/documents/labour-relations-act-1995) | Labour disputes, unfair dismissal |
| Basic Conditions of Employment Act | 1997 | [Link](https://www.gov.za/documents/basic-conditions-employment-act-1997) | Employment contracts, wages |
| Bills of Exchange Act | 1964 | [Link](https://www.gov.za/documents/bills-exchange-act-1964) | Commercial contracts |

### Tier 2: Important (Download Next)

| Act | Year | Link | Relevance |
|-----|------|------|-----------|
| Employment Equity Act | 1998 | [Link](https://www.gov.za/documents/employment-equity-act-1998) | Labour law, discrimination |
| POPIA | 2000 | [Link](https://www.gov.za/documents/promotion-access-information-act-2000) | Privacy, data protection |
| Succession Act | 1957 | [Link](https://www.gov.za/documents/succession-act-1957) | Inheritance, estates |
| Promotion of Access to Courts Act | 1997 | [Link](https://www.gov.za/documents/promotion-access-courts-bill-1997) | Access to justice |

### Tier 3: Supporting (Download If Time Permits)

| Act | Year | Link |
|-----|------|------|
| Alienation of Land Act | 1981 | [Link](https://www.gov.za/documents/alienation-land-act-1981) |
| Close Corporations Act | 1984 | [Link](https://www.gov.za/documents/close-corporations-act-1984) |
| Companies Act | 2008 | [Link](https://www.gov.za/documents/companies-act-2008) |

---

## Download Instructions

### Using Browser (Manual)

1. Visit [gov.za/documents/acts](https://www.gov.za/documents/acts)
2. Search for the Act name
3. Click on the Act
4. Download the PDF
5. Save to `documents/legislation/` folder
6. **Rename to standardized format**: `ActName_Year.pdf`
   - Example: `Labour_Relations_Act_1995.pdf`
   - Example: `Constitution_of_RSA_1996.pdf`

### Using Script (Automated - Limited)

If you want to use the automated gov.za scraper:

```bash
npm run scrape-acts
```

**Note**: This may not reliably find all Acts. Manual download is more reliable.

---

## Filename Conventions

The ingestion script expects this format:

```
ActName_Year.pdf
```

Examples:
- `Labour_Relations_Act_1995.pdf`
- `Constitution_of_RSA_1996.pdf`
- `Bills_of_Exchange_Act_1964.pdf`
- `Employment_Equity_Act_1998.pdf`
- `POPIA_2000.pdf`

---

## Verification

After downloading, verify your folder structure:

```
documents/
├── legislation/
│   ├── Constitution_of_RSA_1996.pdf
│   ├── Labour_Relations_Act_1995.pdf
│   ├── Basic_Conditions_Employment_Act_1997.pdf
│   ├── Bills_of_Exchange_Act_1964.pdf
│   └── [more Acts...]
```

---

## Running Ingestion

Once you have the PDFs in `documents/legislation/`:

```bash
# Run the ingestion script
npm run ingest-legislation

# This will:
# 1. Extract text from each PDF
# 2. Chunk by legal sections
# 3. Generate embeddings
# 4. Store in Astra DB
```

---

## Troubleshooting

### "Directory not found"
```bash
mkdir -p documents/legislation
```

### PDF extraction fails
- Ensure PDF is not password-protected
- If scanned PDF, OCR will be used (slower)
- Check file size (>100KB recommended)

### Chunks too small
- Legislation files should be >500 characters
- Short Acts may yield fewer chunks

---

## Next Steps

After ingestion:

1. **Re-embed all documents**:
   ```bash
   npm run reembed-docs
   ```

2. **Test the knowledge base**:
   ```bash
   npm run test:comprehensive
   npm run test:prompts
   ```

3. **Verify Contract Law accuracy**:
   - Test with contract-related queries
   - Expected improvement: 25% → 75%+

---

## Sources

- South African Government Documents: https://www.gov.za/documents
- SAFLII (Open Access): https://www.saflii.org
- Parliament of RSA: https://www.parliament.gov.za

All content is public domain or open access.
