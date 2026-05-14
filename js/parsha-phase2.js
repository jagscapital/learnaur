/**
 * ═══════════════════════════════════════════════════════════
 * PARSHA PAGE - PHASE 2 ENHANCEMENTS
 * Connections display, multi-commentary synthesis
 * ═══════════════════════════════════════════════════════════
 */

// Track if connections have been loaded
let connectionsLoaded = false;
let currentParshaReference = null;

/**
 * Initialize Phase 2 features when page loads
 */
document.addEventListener('DOMContentLoaded', () => {
  // Wait for parsha to be loaded
  setTimeout(() => {
    initializePhase2Features();
  }, 2000);
});

/**
 * Initialize all Phase 2 features
 */
function initializePhase2Features() {
  // Get current parsha reference (set by parsha.js)
  const parshaName = document.getElementById('parshaNameEnglish')?.textContent;

  if (!parshaName || parshaName === 'Loading...') {
    console.log('Waiting for parsha to load...');
    setTimeout(initializePhase2Features, 1000);
    return;
  }

  // Map parsha to reference
  currentParshaReference = window.mapParshaToReference?.(parshaName);

  if (!currentParshaReference) {
    console.error('Could not determine parsha reference');
    return;
  }

  console.log(`📚 Phase 2 initialized for ${parshaName} (${currentParshaReference})`);

  // Enhance connections tab
  enhanceConnectionsTab();

  // Load commentaries in background
  preloadCommentaries();
}

/**
 * Enhance the connections tab to show beautiful panels
 */
function enhanceConnectionsTab() {
  // Listen for connections tab clicks
  const connectionsButton = document.querySelector('[onclick*="connections"]');

  if (connectionsButton) {
    connectionsButton.addEventListener('click', loadConnectionsIfNeeded);
  }
}

/**
 * Load connections only when tab is clicked (lazy loading)
 */
async function loadConnectionsIfNeeded() {
  if (connectionsLoaded || !currentParshaReference) {
    return;
  }

  const container = document.getElementById('connectionsContent');
  if (!container) return;

  connectionsLoaded = true;

  // Show enhanced loading state
  container.innerHTML = DOMPurify.sanitize(`
    <div class="connections-loading">
      <div class="loading-spinner"></div>
      <p><strong>🔍 Discovering Cross-References...</strong></p>
      <p style="margin-top: 1rem; font-size: 0.95rem; color: var(--text-muted);">
        Scanning Talmud, Midrash, and classical commentaries for connections to ${currentParshaReference}
      </p>
    </div>
  `);

  try {
    // Load connections using the display component
    await window.ConnectionsDisplay.displayConnections(currentParshaReference, container);

    console.log('✅ Connections loaded successfully');

  } catch (error) {
    console.error('Error loading connections:', error);
    container.innerHTML = DOMPurify.sanitize(`
      <div class="connections-error">
        <p>❌ Could not load connections at this time.</p>
        <button onclick="retryConnections()" class="btn-secondary" style="margin-top: 1.5rem;">
          Try Again
        </button>
      </div>
    `);
  }
}

/**
 * Retry loading connections
 */
window.retryConnections = function() {
  connectionsLoaded = false;
  loadConnectionsIfNeeded();
};

/**
 * Pre-load commentaries in background for better UX
 */
async function preloadCommentaries() {
  if (!currentParshaReference) return;

  try {
    // Parse reference (e.g., "Genesis.1.1-6.8" → book: Genesis, chapter: 1, verse: 1)
    const parts = currentParshaReference.split('.');
    const book = parts[0];
    const chapter = parseInt(parts[1]);
    const verse = parseInt(parts[2]);

    if (book && chapter && verse) {
      console.log(`📖 Pre-loading commentaries for ${book} ${chapter}:${verse}`);

      // Load first verse commentaries in background
      window.CommentaryLoader?.getAllCommentaries(book, chapter, verse).then(commentaries => {
        console.log(`✅ Commentaries cached:`, Object.keys(commentaries));
      });
    }
  } catch (error) {
    console.error('Error pre-loading commentaries:', error);
  }
}

/**
 * Enhanced show commentary tab function (extends existing)
 */
const originalShowCommentaryTab = window.showCommentaryTab;

window.showCommentaryTab = function(tabName) {
  // Call original function if it exists
  if (typeof originalShowCommentaryTab === 'function') {
    originalShowCommentaryTab(tabName);
  } else {
    // Fallback implementation
    document.querySelectorAll('.comm-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.commentary-tab-content').forEach(content => content.classList.remove('active'));

    const activeButton = document.querySelector(`[onclick*="${tabName}"]`);
    const activeContent = document.getElementById(`${tabName}Tab`);

    if (activeButton) activeButton.classList.add('active');
    if (activeContent) activeContent.classList.add('active');
  }

  // Load connections when connections tab is shown
  if (tabName === 'connections') {
    loadConnectionsIfNeeded();
  }
};

console.log('📚 Phase 2 parsha enhancements loaded');
