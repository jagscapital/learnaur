/**
 * ═══════════════════════════════════════════════════════════
 * SEARCH FUNCTIONALITY
 * Real-time Torah search with Sefaria API integration
 * ═══════════════════════════════════════════════════════════
 */

let searchTimeout = null;
let currentResults = [];

// Initialize search on page load
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.querySelector('.search-input');
  const resultsContainer = createResultsContainer();

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();

      // Clear previous timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      // Debounce search (wait 500ms after user stops typing)
      searchTimeout = setTimeout(() => {
        if (query.length >= 3) {
          performSearch(query, resultsContainer);
        } else if (query.length === 0) {
          clearResults(resultsContainer);
        }
      }, 500);
    });

    // Search on Enter key
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const query = e.target.value.trim();
        if (query.length >= 3) {
          if (searchTimeout) clearTimeout(searchTimeout);
          performSearch(query, resultsContainer);
        }
      }
    });
  }
});

/**
 * Create results container below search bar
 */
function createResultsContainer() {
  const existing = document.getElementById('searchResults');
  if (existing) return existing;

  const container = document.createElement('div');
  container.id = 'searchResults';
  container.className = 'search-results-container';

  const searchSection = document.querySelector('.hero');
  if (searchSection) {
    searchSection.appendChild(container);
  }

  return container;
}

/**
 * Perform actual search using Sefaria API
 */
async function performSearch(query, resultsContainer) {
  // Show loading state
  resultsContainer.innerHTML = DOMPurify.sanitize(`
    <div class="search-loading">
      <div class="loading-spinner"></div>
      <p>Searching Torah, Talmud, and commentaries...</p>
    </div>
  `);
  resultsContainer.classList.add('active');

  try {
    // Search Sefaria
    const results = await searchSefaria(query);

    if (results && results.length > 0) {
      currentResults = results;
      displayResults(results, resultsContainer, query);
    } else {
      showNoResults(resultsContainer, query);
    }
  } catch (error) {
    console.error('Search error:', error);
    showError(resultsContainer, query);
  }
}

/**
 * Display search results
 */
function displayResults(results, container, query) {
  const html = `
    <div class="search-results-header">
      <h3>Found ${results.length} results for "${query}"</h3>
    </div>

    <div class="search-results-list">
      ${results.slice(0, 20).map((result, index) => createResultCard(result, index)).join('')}
    </div>

    ${results.length > 20 ? `
      <div class="search-results-footer">
        <p>Showing first 20 results of ${results.length} total matches</p>
        <button class="btn-secondary" onclick="showAllResults()">View All Results</button>
      </div>
    ` : ''}
  `;

  container.innerHTML = DOMPurify.sanitize(html);
}

/**
 * Create individual result card
 */
function createResultCard(result, index) {
  const { ref, text, type, category } = result;

  // Truncate long text
  const displayText = text.length > 300 ? text.substring(0, 300) + '...' : text;

  // Determine icon based on category
  const icon = getCategoryIcon(category || type);

  return `
    <div class="search-result-card" data-index="${index}">
      <div class="result-header">
        <div class="result-icon">${icon}</div>
        <div class="result-meta">
          <h4 class="result-ref">${ref}</h4>
          <span class="result-category">${category || type || 'Torah'}</span>
        </div>
      </div>

      <div class="result-text">
        ${displayText}
      </div>

      <div class="result-actions">
        <a href="https://www.sefaria.org/${encodeURIComponent(ref)}"
           target="_blank"
           rel="noopener"
           class="result-link">
          View on Sefaria →
        </a>
      </div>
    </div>
  `;
}

/**
 * Get icon for category
 */
function getCategoryIcon(category) {
  const icons = {
    'Torah': '📖',
    'Prophets': '🕊️',
    'Writings': '📜',
    'Talmud': '📚',
    'Midrash': '💬',
    'Halakhah': '⚖️',
    'Kabbalah': '✨',
    'Liturgy': '🕎',
    'Chasidut': '🕯️',
    'Commentary': '💡',
    'Tanakh': '📖'
  };

  // Check if category contains any key
  for (const [key, icon] of Object.entries(icons)) {
    if (category && category.includes(key)) {
      return icon;
    }
  }

  return '📄'; // Default
}

/**
 * Show no results message
 */
function showNoResults(container, query) {
  container.innerHTML = DOMPurify.sanitize(`
    <div class="search-no-results">
      <div class="no-results-icon">🔍</div>
      <h3>No results found for "${query}"</h3>
      <p>Try different keywords or search for:</p>
      <div class="search-suggestions">
        <button class="suggestion-btn" onclick="searchFor('Abraham')">Abraham</button>
        <button class="suggestion-btn" onclick="searchFor('Creation')">Creation</button>
        <button class="suggestion-btn" onclick="searchFor('Shabbat')">Shabbat</button>
        <button class="suggestion-btn" onclick="searchFor('Faith')">Faith</button>
        <button class="suggestion-btn" onclick="searchFor('Justice')">Justice</button>
      </div>
    </div>
  `);
}

/**
 * Show error message
 */
function showError(container, query) {
  container.innerHTML = DOMPurify.sanitize(`
    <div class="search-error">
      <div class="error-icon">⚠️</div>
      <h3>Search temporarily unavailable</h3>
      <p>Unable to complete search for "${query}". Please try again in a moment.</p>
      <button class="btn-primary" onclick="location.reload()">Retry</button>
    </div>
  `);
}

/**
 * Clear search results
 */
function clearResults(container) {
  container.classList.remove('active');
  container.innerHTML = '';
  currentResults = [];
}

/**
 * Search for suggested term
 */
function searchFor(term) {
  const searchInput = document.querySelector('.search-input');
  if (searchInput) {
    searchInput.value = term;
    searchInput.dispatchEvent(new Event('input'));
  }
}

/**
 * Show all results (pagination)
 */
function showAllResults() {
  const container = document.getElementById('searchResults');
  if (container && currentResults.length > 20) {
    displayResults(currentResults, container, document.querySelector('.search-input').value);
  }
}

// Export functions
window.searchFor = searchFor;
window.showAllResults = showAllResults;
