# Phase 2: Prepare Legislation - Complete Guide

**Status**: Ready to execute  
**Duration**: 2-3 hours  
**Outcome**: 4+ South African Acts downloaded and verified

---

## Overview

Phase 2 focuses on downloading South African legislation from gov.za in preparation for ingestion. This guide provides automated and manual methods.

---

## Option A: Automated Download (Recommended)

### Step 1: Run the Downloader Script

```bash
npm run download-legislation
```

**What it does:**
- Searches gov.za for each Act
- Extracts PDF download links
- Downloads files with retry logic
- Respects rate limiting (1.5 second delays)
- Validates file sizes

**Expected output:**
```
🚀 Starting South African Legislation Download

📋 Found 4 acts to download (Tier 1 and below)

📜 Constitution of the RSA (1996)
   Constitutional foundation, fundamental rights, interpretation principles
────────────────────────────────────────────────────────────────────────────
   🔍 Searching gov.za for: Constitution of the Republic of South Africa 1996
   ✅ Found: https://www.gov.za/documents/constitution-republic-south-africa-1996...
   📄 Extracting PDF URL...
   ✅ PDF URL: https://www.gov.za/sites/default/files/Constitution_RSA96_eng.pdf
   ⬇️  Downloading to Constitution_of_RSA_1996.pdf...
   ✅ Downloaded (450.25 KB)

[... more acts ...]

📊 Download Summary
   ✅ Successfully downloaded: 4
   ⏭️  Already existed: 0
   ❌ Failed: 0

📂 Location: documents/legislation/

✅ Ready for ingestion!
```

### Step 2: Verify Downloads

```bash
npm run verify-legislation
```

**Expected output:**
```
📋 Legislation Verification Report

📂 Folder: documents/legislation/
📄 Files found: 4

✅ Constitution_of_RSA_1996.pdf
   Size: 450.25 KB (min: 100 KB)
✅ Labour_Relations_Act_1995.pdf
   Size: 380.50 KB (min: 100 KB)
✅ Basic_Conditions_Employment_Act_1997.pdf
   Size: 220.75 KB (min: 50 KB)
✅ Bills_of_Exchange_Act_1964.pdf
   Size: 180.30 KB (min: 50 KB)

📊 Summary
   Tier 1 Acts (Critical): 4/4
   Tier 2 Acts (Important): 0/4
   Total Found: 4/8

✅ All required legislation present!

🚀 Next steps:
   npm run ingest-legislation    # Process the acts
   npm run reembed-docs          # Generate embeddings
   npm run test:comprehensive    # Test vector search
```

### Step 3: Download Additional Tier 2 Acts (Optional)

```bash
npm run download-legislation -- --tier 2
```

This downloads Tier 1 AND Tier 2 acts (8 total).

---

## Option B: Manual Download (If Automated Fails)

If the downloader script encounters issues, download manually:

### Step 1: Visit Gov.za

Go to: https://www.gov.za/documents/acts

### Step 2: Download Each Act

For each Act below, search on gov.za and download the PDF:

**Tier 1 (Required):**

1. **Constitution of the RSA (1996)**
   - Search: "Constitution of the Republic of South Africa 1996"
   - Save as: `Constitution_of_RSA_1996.pdf`

2. **Labour Relations Act (1995)**
   - Search: "Labour Relations Act 1995"
   - Save as: `Labour_Relations_Act_1995.pdf`

3. **Basic Conditions of Employment Act (1997)**
   - Search: "Basic Conditions of Employment Act 1997"
   - Save as: `Basic_Conditions_Employment_Act_1997.pdf`

4. **Bills of Exchange Act (1964)**
   - Search: "Bills of Exchange Act 1964"
   - Save as: `Bills_of_Exchange_Act_1964.pdf`

**Tier 2 (Optional but recommended):**

5. **Employment Equity Act (1998)**
   - Save as: `Employment_Equity_Act_1998.pdf`

6. **POPIA (2000)**
   - Save as: `POPIA_2000.pdf`

7. **Succession Act (1957)**
   - Save as: `Succession_Act_1957.pdf`

8. **Promotion of Access to Courts Act (1997)**
   - Save as: `Promotion_Access_Courts_Act_1997.pdf`

### Step 3: Save to Correct Folder

Move all downloaded PDFs to:
```
documents/legislation/
```

**Naming convention** (Important):
```
ActName_Year.pdf
```

Examples:
- ✅ `Constitution_of_RSA_1996.pdf`
- ✅ `Labour_Relations_Act_1995.pdf`
- ❌ `Constitution 1996.pdf` (wrong - has space, no Act name)
- ❌ `lra95.pdf` (wrong - unclear, no year)

### Step 4: Verify

```bash
npm run verify-legislation
```

---

## Troubleshooting

### "Module not found: tsx"
```bash
npm install -D tsx
```

### "documents/legislation folder not found"
```bash
mkdir -p documents/legislation
```

### Download script hangs
- Network issue: Check internet connection
- Gov.za blocked: Try manual download
- Rate limit: Script waits 1.5 seconds between requests (normal)

### File size seems wrong
```bash
# Check file size
ls -lh documents/legislation/

# If <50KB, likely corrupted - re-download
```

### "PDF extraction fails during ingestion"
- Likely a scanned PDF without OCR
- Ingestion script will handle this with character-based chunking
- Not a problem, just slower processing

---

## File Checklist

After completing Phase 2, verify you have:

```
documents/
└── legislation/
    ├── Constitution_of_RSA_1996.pdf ................. ✅ (MUST HAVE)
    ├── Labour_Relations_Act_1995.pdf ............... ✅ (MUST HAVE)
    ├── Basic_Conditions_Employment_Act_1997.pdf ... ✅ (MUST HAVE)
    ├── Bills_of_Exchange_Act_1964.pdf ............. ✅ (MUST HAVE)
    ├── Employment_Equity_Act_1998.pdf ............. ⭐ (OPTIONAL)
    ├── POPIA_2000.pdf ............................. ⭐ (OPTIONAL)
    ├── Succession_Act_1957.pdf .................... ⭐ (OPTIONAL)
    └── Promotion_Access_Courts_Act_1997.pdf ...... ⭐ (OPTIONAL)
```

**Minimum requirement**: 4 Tier 1 acts (marked MUST HAVE)  
**Recommended**: 4 Tier 1 + 4 Tier 2 (8 total)

---

## Data Integrity

### File Size Validation

The verify script checks minimum sizes:

| Act | Min Size | Typical | Status |
|-----|----------|---------|--------|
| Constitution | 100 KB | 400-500 KB | Good |
| Labour Relations | 100 KB | 350-400 KB | Good |
| BCEA | 50 KB | 200-250 KB | Good |
| Bills of Exchange | 50 KB | 150-200 KB | Good |

**If file is smaller than minimum:**
- May be text-only version (acceptable)
- Or corrupted (re-download)

### Legal Compliance

✅ All files are from gov.za (public domain)  
✅ Respects robots.txt  
✅ No authentication required  
✅ No licensing restrictions  

---

## Next Steps After Phase 2

Once you have verified legislation files:

### Immediate Next:
```bash
npm run ingest-legislation
```

This processes the acts and stores them in the database.

### Then:
```bash
npm run reembed-docs
```

Generates embeddings for vector search.

### Finally:
```bash
npm run test:comprehensive
npm run test:prompts
```

Tests the knowledge base.

---

## Timeline

| Step | Duration | Command |
|------|----------|---------|
| Download Tier 1 Acts | 5-10 min | `npm run download-legislation` |
| Verify downloads | 1 min | `npm run verify-legislation` |
| Download Tier 2 Acts | 5-10 min | `npm run download-legislation -- --tier 2` |
| Manual download (if needed) | 15-30 min | Browser |
| **Total Phase 2** | **30-60 min** | - |

Remaining phases:
- Phase 3 (Ingest & Scrape): 4-6 hours
- Phase 4 (Test & Verify): 2-3 hours

---

## Success Criteria

✅ Phase 2 is complete when:
- [ ] 4+ Tier 1 acts downloaded
- [ ] Files are >50 KB each
- [ ] `npm run verify-legislation` returns 0 (success)
- [ ] No corruption or missing files
- [ ] Ready to proceed to Phase 3

---

## Support

**For download issues:**
- Check internet connectivity
- Try manual download from gov.za
- Verify naming convention

**For file issues:**
- Check file sizes with `ls -lh documents/legislation/`
- Re-download if <50KB
- Verify no special characters in filenames

**For technical issues:**
- Check Node.js version: `node --version` (need v16+)
- Check tsx installed: `npm list tsx`
- Check folder permissions: `ls -la documents/`

---

## Commands Summary

```bash
# Download Tier 1 acts (critical)
npm run download-legislation

# Download Tier 1 & 2 acts (all recommended)
npm run download-legislation -- --tier 2

# Verify downloads are correct
npm run verify-legislation

# Next: Process the legislation
npm run ingest-legislation

# Then: Generate embeddings
npm run reembed-docs
```

---

**Ready to start?** Run: `npm run download-legislation`

If that doesn't work, manually download from: https://www.gov.za/documents/acts

Then verify with: `npm run verify-legislation`

---

*Created: January 4, 2026*  
*Status: Ready to Execute*  
*Phase: 2 of 4*
