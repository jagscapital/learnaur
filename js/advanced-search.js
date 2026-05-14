/**
 * Advanced Search Across All Commentaries
 * Full-text search with filters, facets, and relevance ranking
 */

const AdvancedSearch = {
  searchIndex: null,
  filters: {
    books: [],
    commentators: [],
    topics: []
  },

  /**
   * Initialize search system
   */
  async init() {
    // Build search index from cached Sefaria data
    await this.buildSearchIndex();
  },

  /**
   * Build search index
   */
  async buildSearchIndex() {
    // This would ideally use a library like Lunr.js or Fuse.js
    // For now, we'll use a simple in-memory index
    this.searchIndex = {
      texts: [],
      commentaries: [],
      keywords: new Map()
    };

    // Index will be built incrementally as data is loaded
  },

  /**
   * Search across all content
   */
  async search(query, options = {}) {
    const {
      books = [],
      commentators = [],
      searchIn = ['text', 'commentary'], // text, commentary, both
      exact = false,
      limit = 50
    } = options;

    const results = [];

    // Normalize query
    const normalizedQuery = this.normalizeQuery(query);
    const keywords = normalizedQuery.split(/\s+/);

    // Search in texts
    if (searchIn.includes('text')) {
      const textResults = await this.searchTexts(keywords, books, exact);
      results.push(...textResults);
    }

    // Search in commentaries
    if (searchIn.includes('commentary')) {
      const commentaryResults = await this.searchCommentaries(keywords, commentators, exact);
      results.push(...commentaryResults);
    }

    // Rank and sort results
    const rankedResults = this.rankResults(results, keywords);

    return rankedResults.slice(0, limit);
  },

  /**
   * Normalize search query
   */
  normalizeQuery(query) {
    return query
      .toLowerCase()
      .replace(/[^\w\s\u0590-\u05FF]/g, '') // Keep alphanumeric and Hebrew
      .trim();
  },

  /**
   * Search in Torah texts
   */
  async searchTexts(keywords, books, exact) {
    const results = [];

    // Search using Sefaria API
    for (const keyword of keywords) {
      try {
        const response = await fetch(
          `https://www.sefaria.org/api/search-wrapper?q=${encodeURIComponent(keyword)}&type=text`
        );
        const data = await response.json();

        if (data.hits && data.hits.hits) {
          for (const hit of data.hits.hits) {
            results.push({
              type: 'text',
              reference: hit._source.ref,
              text: hit._source.exact || hit._source.naive_lemmatizer,
              hebrew: hit._source.he || '',
              score: hit._score,
              book: this.extractBook(hit._source.ref)
            });
          }
        }
      } catch (error) {
        console.error('Search error:', error);
      }
    }

    // Filter by books if specified
    if (books.length > 0) {
      return results.filter(r => books.includes(r.book));
    }

    return results;
  },

  /**
   * Search in commentaries
   */
  async searchCommentaries(keywords, commentators, exact) {
    const results = [];

    for (const keyword of keywords) {
      try {
        const response = await fetch(
          `https://www.sefaria.org/api/search-wrapper?q=${encodeURIComponent(keyword)}&type=sheet`
        );
        const data = await response.json();

        if (data.hits && data.hits.hits) {
          for (const hit of data.hits.hits) {
            results.push({
              type: 'commentary',
              reference: hit._source.ref,
              text: hit._source.exact || hit._source.naive_lemmatizer,
              commentator: this.extractCommentator(hit._source.ref),
              score: hit._score
            });
          }
        }
      } catch (error) {
        console.error('Commentary search error:', error);
      }
    }

    // Filter by commentators if specified
    if (commentators.length > 0) {
      return results.filter(r => commentators.includes(r.commentator));
    }

    return results;
  },

  /**
   * Extract book from reference
   */
  extractBook(reference) {
    const books = ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy'];
    for (const book of books) {
      if (reference.includes(book)) return book;
    }
    return 'Unknown';
  },

  /**
   * Extract commentator from reference
   */
  extractCommentator(reference) {
    const commentators = ['Rashi', 'Ramban', 'Ibn Ezra', 'Sforno', 'Ohr HaChaim', 'Kli Yakar'];
    for (const commentator of commentators) {
      if (reference.includes(commentator)) return commentator;
    }
    return 'Unknown';
  },

  /**
   * Rank search results by relevance
   */
  rankResults(results, keywords) {
    return results
      .map(result => {
        let relevanceScore = result.score || 0;

        // Boost exact phrase matches
        const text = (result.text || '').toLowerCase();
        const fullQuery = keywords.join(' ');
        if (text.includes(fullQuery)) {
          relevanceScore *= 2;
        }

        // Boost keyword frequency
        for (const keyword of keywords) {
          const matches = (text.match(new RegExp(keyword, 'gi')) || []).length;
          relevanceScore += matches * 0.5;
        }

        return {
          ...result,
          relevanceScore
        };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  },

  /**
   * Get search suggestions (autocomplete)
   */
  async getSuggestions(partialQuery, limit = 10) {
    if (partialQuery.length < 2) return [];

    const suggestions = [];

    // Common Torah topics
    const topics = [
      'creation', 'covenant', 'sabbath', 'prayer', 'repentance',
      'charity', 'justice', 'faith', 'love', 'peace', 'wisdom',
      'commandments', 'prophecy', 'redemption', 'exile'
    ];

    const matching = topics.filter(topic =>
      topic.toLowerCase().startsWith(partialQuery.toLowerCase())
    );

    suggestions.push(...matching.slice(0, limit));

    return suggestions;
  },

  /**
   * Build search facets (for filtering)
   */
  buildFacets(results) {
    const facets = {
      books: {},
      commentators: {},
      types: {}
    };

    for (const result of results) {
      // Count books
      if (result.book) {
        facets.books[result.book] = (facets.books[result.book] || 0) + 1;
      }

      // Count commentators
      if (result.commentator) {
        facets.commentators[result.commentator] =
          (facets.commentators[result.commentator] || 0) + 1;
      }

      // Count types
      facets.types[result.type] = (facets.types[result.type] || 0) + 1;
    }

    return facets;
  }
};

/**
 * Advanced Search UI
 */
const AdvancedSearchUI = {
  /**
   * Render search interface
   */
  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="advanced-search">
        <div class="search-header">
          <h2>Search Torah & Commentaries</h2>
          <p class="search-description">
            Search across all Torah texts, Rashi, Ramban, Ibn Ezra, and more
          </p>
        </div>

        <div class="search-box">
          <input
            type="text"
            id="advancedSearchInput"
            class="search-input"
            placeholder="Search for verses, topics, or concepts..."
            aria-label="Search query"
          />
          <button id="advancedSearchBtn" class="search-btn" aria-label="Search">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/>
            </svg>
          </button>
        </div>

        <div class="search-filters">
          <div class="filter-group">
            <label>Search In:</label>
            <div class="checkbox-group">
              <label><input type="checkbox" name="searchIn" value="text" checked> Torah Text</label>
              <label><input type="checkbox" name="searchIn" value="commentary" checked> Commentaries</label>
            </div>
          </div>

          <div class="filter-group">
            <label>Books:</label>
            <select id="booksFilter" multiple size="5">
              <option value="Genesis">Genesis</option>
              <option value="Exodus">Exodus</option>
              <option value="Leviticus">Leviticus</option>
              <option value="Numbers">Numbers</option>
              <option value="Deuteronomy">Deuteronomy</option>
            </select>
          </div>

          <div class="filter-group">
            <label>Commentators:</label>
            <select id="commentatorsFilter" multiple size="5">
              <option value="Rashi">Rashi</option>
              <option value="Ramban">Ramban</option>
              <option value="Ibn Ezra">Ibn Ezra</option>
              <option value="Sforno">Sforno</option>
              <option value="Ohr HaChaim">Ohr HaChaim</option>
              <option value="Kli Yakar">Kli Yakar</option>
            </select>
          </div>
        </div>

        <div class="search-results" id="searchResults">
          <p class="search-prompt">Enter a search term to begin</p>
        </div>
      </div>
    `;

    this.attachEventListeners();
  },

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    const searchInput = document.getElementById('advancedSearchInput');
    const searchBtn = document.getElementById('advancedSearchBtn');

    if (searchBtn) {
      searchBtn.addEventListener('click', () => this.performSearch());
    }

    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.performSearch();
      });

      // Autocomplete
      searchInput.addEventListener('input', async (e) => {
        const suggestions = await AdvancedSearch.getSuggestions(e.target.value);
        // TODO: Display suggestions dropdown
      });
    }
  },

  /**
   * Perform search
   */
  async performSearch() {
    const query = document.getElementById('advancedSearchInput').value.trim();
    if (!query) return;

    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '<div class="search-loading">Searching...</div>';

    // Get filter options
    const searchInCheckboxes = document.querySelectorAll('input[name="searchIn"]:checked');
    const searchIn = Array.from(searchInCheckboxes).map(cb => cb.value);

    const booksFilter = document.getElementById('booksFilter');
    const books = Array.from(booksFilter.selectedOptions).map(opt => opt.value);

    const commentatorsFilter = document.getElementById('commentatorsFilter');
    const commentators = Array.from(commentatorsFilter.selectedOptions).map(opt => opt.value);

    // Perform search
    const results = await AdvancedSearch.search(query, {
      searchIn,
      books,
      commentators
    });

    this.displayResults(results, query);
  },

  /**
   * Display search results
   */
  displayResults(results, query) {
    const resultsContainer = document.getElementById('searchResults');

    if (results.length === 0) {
      resultsContainer.innerHTML = `
        <div class="no-results">
          <p>No results found for "${this.escapeHTML(query)}"</p>
          <p class="suggestion">Try different keywords or remove filters</p>
        </div>
      `;
      return;
    }

    const resultsHTML = `
      <div class="results-header">
        <h3>Found ${results.length} results</h3>
      </div>
      <div class="results-list">
        ${results.map(result => this.renderResult(result, query)).join('')}
      </div>
    `;

    resultsContainer.innerHTML = resultsHTML;
  },

  /**
   * Render individual result
   */
  renderResult(result, query) {
    const highlightedText = this.highlightMatch(result.text, query);

    return `
      <div class="search-result-card">
        <div class="result-header">
          <span class="result-type ${result.type}">${result.type}</span>
          <a href="https://www.sefaria.org/${result.reference}" target="_blank" class="result-reference">
            ${result.reference}
          </a>
        </div>
        <div class="result-text">${highlightedText}</div>
        ${result.hebrew ? `<div class="result-hebrew">${result.hebrew}</div>` : ''}
        ${result.commentator ? `<div class="result-commentator">— ${result.commentator}</div>` : ''}
      </div>
    `;
  },

  /**
   * Highlight search matches
   */
  highlightMatch(text, query) {
    if (!text || !query) return this.escapeHTML(text || '');

    const escapedText = this.escapeHTML(text);
    const keywords = query.toLowerCase().split(/\s+/);

    let highlighted = escapedText;
    for (const keyword of keywords) {
      const regex = new RegExp(`(${keyword})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark>$1</mark>');
    }

    return highlighted;
  },

  /**
   * Escape HTML
   */
  escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

// Export for global access
window.AdvancedSearch = AdvancedSearch;
window.AdvancedSearchUI = AdvancedSearchUI;
