/**
 * ═══════════════════════════════════════════════════════════
 * DAVENING (PRAYER) PAGE FUNCTIONALITY
 * Sacred Prayer Service Management
 * ═══════════════════════════════════════════════════════════
 */

let currentService = null;
let showTranslation = true;
let showTransliteration = false;
let fontSize = 100; // percentage

// ─────────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Hebrew date
  await initializeHebrewDateAPI();

  // Check URL parameters for specific service
  const urlParams = new URLSearchParams(window.location.search);
  const service = urlParams.get('service');

  if (service) {
    showService(service);
  }
});

// ─────────────────────────────────────────────
// SERVICE NAVIGATION
// ─────────────────────────────────────────────
function showService(serviceName) {
  // Hide all services
  document.querySelectorAll('.prayer-service').forEach(service => {
    service.classList.remove('active');
  });

  // Hide service selector
  const selectorSection = document.querySelector('.prayer-selector-section');
  if (selectorSection) {
    selectorSection.style.display = 'none';
  }

  // Show requested service
  const targetService = document.getElementById(`${serviceName}Service`);
  if (targetService) {
    targetService.classList.add('active');
    currentService = serviceName;

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update URL without reload
    const newUrl = `${window.location.pathname}?service=${serviceName}`;
    window.history.pushState({ service: serviceName }, '', newUrl);
  }
}

function hideService() {
  // Hide all services
  document.querySelectorAll('.prayer-service').forEach(service => {
    service.classList.remove('active');
  });

  // Show service selector
  const selectorSection = document.querySelector('.prayer-selector-section');
  if (selectorSection) {
    selectorSection.style.display = 'block';
  }

  currentService = null;

  // Update URL
  window.history.pushState({}, '', window.location.pathname);

  // Scroll to selector
  setTimeout(() => {
    selectorSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

// Handle browser back/forward
window.addEventListener('popstate', (event) => {
  if (event.state && event.state.service) {
    showService(event.state.service);
  } else {
    hideService();
  }
});

// ─────────────────────────────────────────────
// PRAYER OPTIONS
// ─────────────────────────────────────────────
function toggleTranslation(show) {
  showTranslation = show;

  const englishPrayers = document.querySelectorAll('.english-prayer');

  if (show) {
    englishPrayers.forEach(el => {
      el.style.display = 'block';
    });
  } else {
    englishPrayers.forEach(el => {
      el.style.display = 'none';
    });
  }

  // Update button state
  updateButtonStates();
}

function toggleTransliteration(show) {
  showTransliteration = show;

  // This would show/hide transliteration if available
  // For now, it's a placeholder

  updateButtonStates();
}

function updateButtonStates() {
  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  if (showTranslation) {
    const translationBtn = Array.from(document.querySelectorAll('.option-btn'))
      .find(btn => btn.textContent.includes('Translation'));
    if (translationBtn) translationBtn.classList.add('active');
  }

  if (showTransliteration) {
    const translitBtn = Array.from(document.querySelectorAll('.option-btn'))
      .find(btn => btn.textContent.includes('Transliteration'));
    if (translitBtn) translitBtn.classList.add('active');
  }
}

function adjustFontSize(action) {
  if (action === 'increase') {
    fontSize = Math.min(fontSize + 10, 200);
  } else if (action === 'decrease') {
    fontSize = Math.max(fontSize - 10, 80);
  }

  // Apply font size
  document.querySelectorAll('.hebrew-prayer, .english-prayer').forEach(el => {
    el.style.fontSize = `${fontSize}%`;
  });
}

// ─────────────────────────────────────────────
// PRAYER TEXT LOADING (Future Enhancement)
// ─────────────────────────────────────────────

/**
 * Load full prayer texts from authenticated sources
 * This would integrate with Chabad.org or Sefaria APIs
 */
async function loadPrayerTexts(serviceName) {
  try {
    // Future: Fetch from authenticated prayer APIs
    // For now, prayers are embedded in HTML

    // Example of how this could work:
    // const response = await fetch(`/api/prayers/${serviceName}`);
    // const prayers = await response.json();
    // renderPrayers(prayers);

  } catch (error) {
    console.error('Error loading prayers:', error);
  }
}

/**
 * Render prayers dynamically
 */
function renderPrayers(prayers) {
  // This would render prayers from JSON/API data
  // Ensuring Hebrew text integrity and proper formatting
}

// ─────────────────────────────────────────────
// TIME-BASED SUGGESTIONS
// ─────────────────────────────────────────────
function suggestCurrentService() {
  const now = new Date();
  const hour = now.getHours();

  // Shacharit: Before noon
  if (hour >= 6 && hour < 12) {
    return 'shacharit';
  }
  // Mincha: Afternoon
  else if (hour >= 12 && hour < 18) {
    return 'mincha';
  }
  // Maariv: Evening/Night
  else {
    return 'maariv';
  }
}

// Optionally highlight suggested service
function highlightSuggestedService() {
  const suggested = suggestCurrentService();
  const serviceCard = document.querySelector(`[onclick="showService('${suggested}')"]`);

  if (serviceCard) {
    const badge = document.createElement('div');
    badge.className = 'suggested-badge';
    badge.textContent = 'Suggested Now';
    badge.style.cssText = `
      position: absolute;
      top: 1rem;
      right: 1rem;
      padding: 0.5rem 1rem;
      background: var(--warm-gold);
      color: var(--sacred-black);
      font-size: 0.75rem;
      font-weight: 700;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    `;
    serviceCard.style.position = 'relative';
    serviceCard.appendChild(badge);
  }
}

// Initialize suggestion on load
setTimeout(highlightSuggestedService, 500);

// ─────────────────────────────────────────────
// PRAYER TRACKING (Optional Feature)
// ─────────────────────────────────────────────
function markSectionComplete(sectionId) {
  // Track which sections user has completed
  // Could save to localStorage for continuity

  const section = document.getElementById(sectionId);
  if (section) {
    section.classList.add('completed');

    // Save to localStorage
    const completedSections = JSON.parse(localStorage.getItem('completedPrayers') || '{}');
    const today = new Date().toDateString();

    if (!completedSections[today]) {
      completedSections[today] = [];
    }

    if (!completedSections[today].includes(sectionId)) {
      completedSections[today].push(sectionId);
      localStorage.setItem('completedPrayers', JSON.stringify(completedSections));
    }
  }
}

// ─────────────────────────────────────────────
// KEYBOARD SHORTCUTS
// ─────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  // Only activate when in a service
  if (!currentService) return;

  // Escape to go back
  if (e.key === 'Escape') {
    hideService();
  }

  // Arrow keys for navigation
  if (e.key === 'ArrowUp') {
    window.scrollBy({ top: -100, behavior: 'smooth' });
  }
  if (e.key === 'ArrowDown') {
    window.scrollBy({ top: 100, behavior: 'smooth' });
  }

  // + / - for font size
  if (e.key === '+' || e.key === '=') {
    adjustFontSize('increase');
  }
  if (e.key === '-') {
    adjustFontSize('decrease');
  }
});

// ─────────────────────────────────────────────
// PRINT FUNCTIONALITY
// ─────────────────────────────────────────────
function printService() {
  window.print();
}

// Add print button to services
document.querySelectorAll('.service-header').forEach(header => {
  const printBtn = document.createElement('button');
  printBtn.className = 'option-btn';
  printBtn.textContent = '🖨 Print';
  printBtn.onclick = printService;
  printBtn.style.cssText = `
    position: absolute;
    top: 1rem;
    right: 1rem;
  `;
  header.style.position = 'relative';
  header.appendChild(printBtn);
});

// ─────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────
window.showService = showService;
window.hideService = hideService;
window.toggleTranslation = toggleTranslation;
window.toggleTransliteration = toggleTransliteration;
window.adjustFontSize = adjustFontSize;
window.markSectionComplete = markSectionComplete;
window.printService = printService;
