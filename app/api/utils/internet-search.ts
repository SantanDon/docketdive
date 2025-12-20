import axios from 'axios';
import * as cheerio from 'cheerio';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

/**
 * Search SAFLII (South African Legal Information Institute) for legal information
 */
async function searchSAFLII(query: string): Promise<SearchResult[]> {
  try {
    const searchUrl = `https://www.saflii.org/cgi-bin/sitequery.pl?query=${encodeURIComponent(query)}&results=10&output=xml`;
    
    const response = await axios.get(searchUrl, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const results: SearchResult[] = [];

    // Parse SAFLII search results
    $('result').each((i, elem) => {
      if (i < 5) { // Limit to 5 results
        const title = $(elem).find('title').text() || 'Untitled';
        const url = $(elem).find('url').text() || '';
        const snippet = $(elem).find('snippet').text() || '';

        if (url && url.includes('saflii.org')) {
          results.push({
            title: title.trim(),
            url: url.trim(),
            snippet: snippet.trim(),
            source: 'SAFLII'
          });
        }
      }
    });

    return results;
  } catch (error) {
    console.error('SAFLII search error:', error);
    return [];
  }
}

/**
 * Fallback: Use DuckDuckGo for South African legal searches
 */
async function searchDuckDuckGo(query: string): Promise<SearchResult[]> {
  try {
    const saQuery = `${query} site:saflii.org OR site:justice.gov.za OR "South African law"`;
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(saQuery)}`;
    
    const response = await axios.get(searchUrl, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const results: SearchResult[] = [];

    $('.result').each((i, elem) => {
      if (i < 5) {
        const titleElem = $(elem).find('.result__title');
        const snippetElem = $(elem).find('.result__snippet');
        const urlElem = $(elem).find('.result__url');

        const title = titleElem.text().trim();
        const snippet = snippetElem.text().trim();
        let url = urlElem.attr('href') || '';

        // Extract actual URL from DuckDuckGo redirect
        if (url.includes('uddg=')) {
          const match = url.match(/uddg=([^&]+)/);
          if (match && match[1]) {
            url = decodeURIComponent(match[1]);
          }
        }

        if (title && url && (url.includes('saflii.org') || url.includes('justice.gov.za') || url.includes('.za'))) {
          results.push({
            title,
            url,
            snippet,
            source: url.includes('saflii.org') ? 'SAFLII' : 'Government'
          });
        }
      }
    });

    return results;
  } catch (error) {
    console.error('DuckDuckGo search error:', error);
    return [];
  }
}

/**
 * Main internet search function for South African legal information
 */
export async function searchSouthAfricanLaw(query: string): Promise<SearchResult[]> {
  console.log(`🌐 Searching internet for: "${query}"`);
  
  try {
    // Try SAFLII first
    let results = await searchSAFLII(query);
    
    // If SAFLII returns nothing, try DuckDuckGo
    if (results.length === 0) {
      results = await searchDuckDuckGo(query);
    }
    
    console.log(`✅ Found ${results.length} internet results`);
    return results;
  } catch (error) {
    console.error('Internet search failed:', error);
    return [];
  }
}

/**
 * Fetch content from a SAFLII URL
 */
export async function fetchSAFLIIContent(url: string): Promise<string> {
  try {
    const response = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DocketDive/1.0)'
      }
    });

    const $ = cheerio.load(response.data);
    
    // Extract main content (SAFLII specific selectors)
    const content = $('.content, .judgment, .legislation, #content').text() || $('body').text();
    
    // Clean and truncate
    const cleaned = content
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim()
      .substring(0, 3000); // Limit to 3000 chars

    return cleaned;
  } catch (error) {
    console.error('Failed to fetch SAFLII content:', error);
    return '';
  }
}

/**
 * Format internet search results for context injection
 */
export function formatInternetResults(results: SearchResult[]): string {
  if (results.length === 0) return '';

  let formatted = '\n\n### INTERNET SEARCH RESULTS (South African Legal Sources):\n\n';
  
  results.forEach((result, index) => {
    formatted += `**[${index + 1}] ${result.title}** (Source: ${result.source})\n`;
    formatted += `URL: ${result.url}\n`;
    if (result.snippet) {
      formatted += `${result.snippet}\n`;
    }
    formatted += '\n';
  });

  formatted += '\nNote: These are supplementary internet sources. Verify information and consult original sources.\n';
  
  return formatted;
}
