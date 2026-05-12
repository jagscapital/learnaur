/**
 * ═══════════════════════════════════════════════════════════
 * SEFARIA API INTEGRATION
 * Authentic Torah texts, commentaries, and cross-references
 * API Documentation: https://developers.sefaria.org/
 * ═══════════════════════════════════════════════════════════
 */

const SefariaAPI = {
  baseURL: 'https://www.sefaria.org/api',
  cache: new Map(),
  cacheExpiry: 7 * 24 * 60 * 60 * 1000 // 1 week
};

/**
 * Fetch Torah portion text from Sefaria
 * @param {string} parsha - Name of the parsha (e.g., "Bereshit")
 * @param {Object} options - Options for text retrieval
 * @returns {Promise<Object>} Torah text with Hebrew and English
 */
async function fetchParshaText(parsha, options = {}) {
  const {
    context = 1,
    commentary = 0,
    language = 'both' // 'hebrew', 'english', or 'both'
  } = options;

  try {
    // Map parsha names to Sefaria references
    const parshaRef = mapParshaToReference(parsha);

    if (!parshaRef) {
      throw new Error(`Unknown parsha: ${parsha}`);
    }

    // Check cache
    const cacheKey = `parsha_${parsha}_${language}`;
    const cached = SefariaAPI.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < SefariaAPI.cacheExpiry) {
      return cached.data;
    }

    // Fetch from Sefaria
    const url = `${SefariaAPI.baseURL}/texts/${parshaRef}?context=${context}&commentary=${commentary}`;

    const response = await fetchWithTimeout(url, {}, 15000);

    if (!response.ok) {
      throw new Error(`Sefaria API error: ${response.status}`);
    }

    const data = await response.json();

    // Process the response
    const processedData = processParshaData(data);

    // Cache the result
    SefariaAPI.cache.set(cacheKey, {
      data: processedData,
      timestamp: Date.now()
    });

    return processedData;

  } catch (error) {
    console.error('Error fetching parsha text:', error);
    throw error;
  }
}

/**
 * Fetch commentaries for a specific verse or passage
 * @param {string} reference - Sefaria reference (e.g., "Genesis 1:1")
 * @returns {Promise<Array>} Array of commentaries
 */
async function fetchCommentaries(reference) {
  try {
    const url = `${SefariaAPI.baseURL}/related/${reference}`;

    const response = await fetchWithTimeout(url, {}, 15000);
    if (!response.ok) {
      throw new Error(`Sefaria API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract and organize commentaries
    const commentaries = [];

    if (data.links) {
      data.links.forEach(link => {
        if (link.category === 'Commentary' || link.type === 'commentary') {
          commentaries.push({
            source: link.collectiveTitle?.en || link.ref,
            hebrew: link.he || '',
            english: link.text || '',
            reference: link.ref,
            category: link.category
          });
        }
      });
    }

    return commentaries;

  } catch (error) {
    console.error('Error fetching commentaries:', error);
    return [];
  }
}

/**
 * Fetch cross-references (Gemara, Mishnah, Midrash connections)
 * @param {string} reference - Sefaria reference
 * @returns {Promise<Object>} Organized cross-references
 */
async function fetchCrossReferences(reference) {
  try {
    const url = `${SefariaAPI.baseURL}/related/${reference}`;

    const response = await fetchWithTimeout(url, {}, 15000);
    if (!response.ok) {
      throw new Error(`Sefaria API error: ${response.status}`);
    }

    const data = await response.json();

    const crossRefs = {
      gemara: [],
      mishnah: [],
      midrash: [],
      other: []
    };

    if (data.links) {
      data.links.forEach(link => {
        const category = link.category?.toLowerCase() || '';

        if (category.includes('talmud') || link.ref.includes('Talmud')) {
          crossRefs.gemara.push(formatCrossReference(link));
        } else if (category.includes('mishnah') || link.ref.includes('Mishnah')) {
          crossRefs.mishnah.push(formatCrossReference(link));
        } else if (category.includes('midrash') || link.ref.includes('Midrash')) {
          crossRefs.midrash.push(formatCrossReference(link));
        } else if (link.type === 'quotation' || link.type === 'reference') {
          crossRefs.other.push(formatCrossReference(link));
        }
      });
    }

    return crossRefs;

  } catch (error) {
    console.error('Error fetching cross-references:', error);
    return { gemara: [], mishnah: [], midrash: [], other: [] };
  }
}

/**
 * Search Sefaria for topics, keywords, or concepts
 * @param {string} query - Search query
 * @param {Object} filters - Search filters
 * @returns {Promise<Array>} Search results
 */
async function searchSefaria(query, filters = {}) {
  try {
    const {
      books = [],
      categories = [],
      limit = 50
    } = filters;

    let url = `${SefariaAPI.baseURL}/search-wrapper?q=${encodeURIComponent(query)}`;

    if (books.length > 0) {
      url += `&books=${books.join('|')}`;
    }

    if (categories.length > 0) {
      url += `&filters=${categories.join('|')}`;
    }

    const response = await fetchWithTimeout(url, {}, 15000);
    if (!response.ok) {
      throw new Error(`Sefaria API error: ${response.status}`);
    }

    const data = await response.json();

    return processSearchResults(data, limit);

  } catch (error) {
    console.error('Error searching Sefaria:', error);
    return [];
  }
}

/**
 * Get index information for a text
 * @param {string} title - Text title
 * @returns {Promise<Object>} Index information
 */
async function getTextIndex(title) {
  try {
    const url = `${SefariaAPI.baseURL}/index/${encodeURIComponent(title)}`;

    const response = await fetchWithTimeout(url, {}, 15000);
    if (!response.ok) {
      throw new Error(`Sefaria API error: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error fetching text index:', error);
    return null;
  }
}

// ─────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────

/**
 * Map parsha name to Sefaria reference
 */
function mapParshaToReference(parsha) {
  const parshaMap = {
    // Genesis
    'Bereshit': 'Genesis.1.1-6.8',
    'Noach': 'Genesis.6.9-11.32',
    'Lech-Lecha': 'Genesis.12.1-17.27',
    'Vayera': 'Genesis.18.1-22.24',
    'Chayei Sara': 'Genesis.23.1-25.18',
    'Toldot': 'Genesis.25.19-28.9',
    'Vayetzei': 'Genesis.28.10-32.3',
    'Vayishlach': 'Genesis.32.4-36.43',
    'Vayeshev': 'Genesis.37.1-40.23',
    'Miketz': 'Genesis.41.1-44.17',
    'Vayigash': 'Genesis.44.18-47.27',
    'Vayechi': 'Genesis.47.28-50.26',

    // Exodus
    'Shemot': 'Exodus.1.1-6.1',
    'Vaera': 'Exodus.6.2-9.35',
    'Bo': 'Exodus.10.1-13.16',
    'Beshalach': 'Exodus.13.17-17.16',
    'Yitro': 'Exodus.18.1-20.23',
    'Mishpatim': 'Exodus.21.1-24.18',
    'Terumah': 'Exodus.25.1-27.19',
    'Tetzaveh': 'Exodus.27.20-30.10',
    'Ki Tisa': 'Exodus.30.11-34.35',
    'Vayakhel': 'Exodus.35.1-38.20',
    'Pekudei': 'Exodus.38.21-40.38',

    // Leviticus
    'Vayikra': 'Leviticus.1.1-5.26',
    'Tzav': 'Leviticus.6.1-8.36',
    'Shmini': 'Leviticus.9.1-11.47',
    'Tazria': 'Leviticus.12.1-13.59',
    'Metzora': 'Leviticus.14.1-15.33',
    'Achrei Mot': 'Leviticus.16.1-18.30',
    'Kedoshim': 'Leviticus.19.1-20.27',
    'Emor': 'Leviticus.21.1-24.23',
    'Behar': 'Leviticus.25.1-26.2',
    'Bechukotai': 'Leviticus.26.3-27.34',

    // Numbers
    'Bamidbar': 'Numbers.1.1-4.20',
    'Nasso': 'Numbers.4.21-7.89',
    'Beha\'alotcha': 'Numbers.8.1-12.16',
    'Sh\'lach': 'Numbers.13.1-15.41',
    'Korach': 'Numbers.16.1-18.32',
    'Chukat': 'Numbers.19.1-22.1',
    'Balak': 'Numbers.22.2-25.9',
    'Pinchas': 'Numbers.25.10-30.1',
    'Matot': 'Numbers.30.2-32.42',
    'Masei': 'Numbers.33.1-36.13',

    // Deuteronomy
    'Devarim': 'Deuteronomy.1.1-3.22',
    'Vaetchanan': 'Deuteronomy.3.23-7.11',
    'Eikev': 'Deuteronomy.7.12-11.25',
    'Re\'eh': 'Deuteronomy.11.26-16.17',
    'Shoftim': 'Deuteronomy.16.18-21.9',
    'Ki Teitzei': 'Deuteronomy.21.10-25.19',
    'Ki Tavo': 'Deuteronomy.26.1-29.8',
    'Nitzavim': 'Deuteronomy.29.9-30.20',
    'Vayeilech': 'Deuteronomy.31.1-31.30',
    'Ha\'Azinu': 'Deuteronomy.32.1-32.52',
    'V\'Zot HaBerachah': 'Deuteronomy.33.1-34.12'
  };

  return parshaMap[parsha] || null;
}

/**
 * Process parsha data from Sefaria
 * Handles complex nested array structures
 */
function processParshaData(data) {
  // Flatten nested arrays if necessary
  const flattenText = (text) => {
    if (!text) return [];
    if (typeof text === 'string') return [text];
    if (Array.isArray(text)) {
      return text.flatMap(item => {
        if (typeof item === 'string') return [item];
        if (Array.isArray(item)) return item.filter(v => v && v.trim());
        return [];
      }).filter(v => v && v.trim());
    }
    return [];
  };

  const hebrew = flattenText(data.he);
  const english = flattenText(data.text);

  return {
    ref: data.ref || '',
    heRef: data.heRef || '',
    hebrew: hebrew,
    english: english,
    sections: data.sections || [],
    sectionNames: data.sectionNames || [],
    book: data.book || '',
    categories: data.categories || [],
    aliyot: extractAliyot(data),
    nextSection: data.next || null,
    prevSection: data.prev || null,
    versesCount: Math.max(hebrew.length, english.length),
    commentary: data.commentary || []
  };
}

/**
 * Extract aliyah information from Sefaria data
 */
function extractAliyot(data) {
  // Standard 7 aliyot for Torah reading
  // This is approximate - ideally would come from dedicated source
  const totalVerses = Array.isArray(data.text) ? data.text.flat().filter(v => v).length : 0;

  if (totalVerses === 0) return [];

  const versesPerAliyah = Math.ceil(totalVerses / 7);

  return [
    { name: 'Rishon', start: 1, end: versesPerAliyah },
    { name: 'Sheni', start: versesPerAliyah + 1, end: versesPerAliyah * 2 },
    { name: 'Shlishi', start: versesPerAliyah * 2 + 1, end: versesPerAliyah * 3 },
    { name: 'Revi\'i', start: versesPerAliyah * 3 + 1, end: versesPerAliyah * 4 },
    { name: 'Chamishi', start: versesPerAliyah * 4 + 1, end: versesPerAliyah * 5 },
    { name: 'Shishi', start: versesPerAliyah * 5 + 1, end: versesPerAliyah * 6 },
    { name: 'Shvi\'i', start: versesPerAliyah * 6 + 1, end: totalVerses }
  ];
}

/**
 * Format cross-reference data
 */
function formatCrossReference(link) {
  return {
    reference: link.ref,
    hebrew: link.he || '',
    english: link.text || '',
    source: link.collectiveTitle?.en || link.sourceRef,
    category: link.category,
    type: link.type
  };
}

/**
 * Process search results
 */
function processSearchResults(data, limit) {
  if (!data.hits || !data.hits.hits) {
    return [];
  }

  return data.hits.hits.slice(0, limit).map(hit => ({
    reference: hit._source.ref,
    hebrew: hit._source.he || '',
    english: hit._source.en || '',
    highlight: hit.highlight || {},
    score: hit._score
  }));
}

/**
 * Clear old cache entries
 */
function clearOldCache() {
  const now = Date.now();
  SefariaAPI.cache.forEach((value, key) => {
    if (now - value.timestamp > SefariaAPI.cacheExpiry) {
      SefariaAPI.cache.delete(key);
    }
  });
}

// Run cache cleanup periodically (every hour)
setInterval(clearOldCache, 60 * 60 * 1000);

// ─────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────
window.SefariaAPI = SefariaAPI;
window.fetchParshaText = fetchParshaText;
window.fetchCommentaries = fetchCommentaries;
window.fetchCrossReferences = fetchCrossReferences;
window.searchSefaria = searchSefaria;
window.getTextIndex = getTextIndex;
window.mapParshaToReference = mapParshaToReference;
