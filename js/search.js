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
      <p>Analyzing topic across all Jewish texts...</p>
      <p style="font-size: 0.9em; opacity: 0.7; margin-top: 0.5rem;">
        Searching Torah • Talmud • Midrash • Commentaries • Generating comprehensive essay...
      </p>
    </div>
  `);
  resultsContainer.classList.add('active');

  try {
    // Use Comprehensive Search if available (generates FULL essays)
    if (window.ComprehensiveSearch) {
      const essay = await window.ComprehensiveSearch.searchAndGenerateEssay(query);

      if (essay && essay.essay) {
        displayEssay(essay, resultsContainer, query);
        return;
      }
    }

    // Fallback to basic search if ComprehensiveSearch not available
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
 * Display comprehensive essay (NO placeholders, COMPLETE content)
 */
function displayEssay(essayData, container, query) {
  const { essay, totalMentions, sources, patterns } = essayData;

  // Format essay paragraphs
  const essayParagraphs = essay.split('\n\n').filter(p => p.trim());

  const html = `
    <div class="comprehensive-essay">
      <div class="essay-header">
        <h2>Comprehensive Analysis: "${query}"</h2>
        <div class="essay-meta">
          <span class="meta-item">📚 ${totalMentions || 0} mentions across all texts</span>
          <span class="meta-item">🔍 ${sources?.length || 0} sources analyzed</span>
          <span class="meta-item">🧩 ${patterns?.length || 0} patterns identified</span>
        </div>
      </div>

      <div class="essay-content">
        ${essayParagraphs.map(paragraph => {
          // Check if paragraph is a heading (ends with :)
          if (paragraph.trim().endsWith(':') && paragraph.length < 100) {
            return `<h3 class="essay-section-heading">${paragraph.trim()}</h3>`;
          }
          return `<p class="essay-paragraph">${paragraph.trim()}</p>`;
        }).join('\n')}
      </div>

      ${sources && sources.length > 0 ? `
        <div class="essay-sources">
          <h3>Sources Referenced</h3>
          <div class="sources-list">
            ${sources.slice(0, 10).map(source => `
              <div class="source-item">
                <span class="source-ref">${source.ref || source}</span>
              </div>
            `).join('')}
            ${sources.length > 10 ? `
              <p class="sources-more">...and ${sources.length - 10} more sources</p>
            ` : ''}
          </div>
        </div>
      ` : ''}

      <div class="essay-footer">
        <p><strong>Complete Analysis Generated</strong> — This essay synthesizes insights from Torah, Talmud, Midrash, and classical commentaries.</p>
      </div>
    </div>
  `;

  container.innerHTML = DOMPurify.sanitize(html);
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
