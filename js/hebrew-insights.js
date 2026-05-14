/**
 * ═══════════════════════════════════════════════════════════
 * HEBREW INSIGHTS - Phase 3
 * Word-level tooltips with etymology, gematria, cross-references
 * Makes every Hebrew word interactive and educational
 * ═══════════════════════════════════════════════════════════
 */

const HebrewInsights = {

  /**
   * Initialize word tooltips on a container
   */
  initializeTooltips(container) {
    if (!container) {
      console.error('Container required for tooltips');
      return;
    }

    // Find all Hebrew text elements
    const hebrewElements = container.querySelectorAll('.hebrew-text, .verse-hebrew, [dir="rtl"]');

    hebrewElements.forEach(element => {
      this.processHebrewText(element);
    });

    // Add tooltip container to body if not exists
    if (!document.getElementById('hebrewTooltip')) {
      this.createTooltipContainer();
    }
  },

  /**
   * Process Hebrew text and make words interactive
   */
  processHebrewText(element) {
    const text = element.textContent;
    if (!text || text.trim().length === 0) return;

    // Split into words (Hebrew words are space-separated)
    const words = text.split(/\s+/);

    // Rebuild with interactive spans
    const html = words.map((word, index) => {
      if (this.isHebrewWord(word)) {
        return `<span class="hebrew-word" data-word="${word}" data-index="${index}">${word}</span>`;
      }
      return word;
    }).join(' ');

    element.innerHTML = DOMPurify.sanitize(html);

    // Add event listeners to interactive words
    element.querySelectorAll('.hebrew-word').forEach(span => {
      span.addEventListener('mouseenter', (e) => this.showTooltip(e));
      span.addEventListener('mouseleave', () => this.hideTooltip());
      span.addEventListener('click', (e) => this.togglePinTooltip(e));
    });
  },

  /**
   * Check if text is Hebrew
   */
  isHebrewWord(text) {
    // Hebrew Unicode range: U+0590 to U+05FF
    return /[\u0590-\u05FF]/.test(text);
  },

  /**
   * Create tooltip container
   */
  createTooltipContainer() {
    const tooltip = document.createElement('div');
    tooltip.id = 'hebrewTooltip';
    tooltip.className = 'hebrew-tooltip';
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);
  },

  /**
   * Show tooltip for a Hebrew word
   */
  async showTooltip(event) {
    const word = event.target.dataset.word;
    if (!word) return;

    const tooltip = document.getElementById('hebrewTooltip');
    if (!tooltip) return;

    // Show loading state
    tooltip.innerHTML = DOMPurify.sanitize(`
      <div class="tooltip-loading">
        <div class="loading-spinner-small"></div>
        <p>Analyzing ${word}...</p>
      </div>
    `);

    tooltip.style.display = 'block';
    this.positionTooltip(tooltip, event.target);

    // Get insights (with caching)
    const insights = await this.getWordInsights(word);

    // Display insights
    tooltip.innerHTML = DOMPurify.sanitize(this.buildTooltipHTML(word, insights));
    this.positionTooltip(tooltip, event.target);
  },

  /**
   * Hide tooltip
   */
  hideTooltip() {
    const tooltip = document.getElementById('hebrewTooltip');
    if (tooltip && !tooltip.classList.contains('pinned')) {
      tooltip.style.display = 'none';
    }
  },

  /**
   * Toggle pinned state (click to keep open)
   */
  togglePinTooltip(event) {
    const tooltip = document.getElementById('hebrewTooltip');
    if (!tooltip) return;

    if (tooltip.classList.contains('pinned')) {
      tooltip.classList.remove('pinned');
      this.hideTooltip();
    } else {
      tooltip.classList.add('pinned');

      // Add close button
      if (!tooltip.querySelector('.tooltip-close')) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'tooltip-close';
        closeBtn.innerHTML = '×';
        closeBtn.onclick = () => {
          tooltip.classList.remove('pinned');
          this.hideTooltip();
        };
        tooltip.insertBefore(closeBtn, tooltip.firstChild);
      }
    }
  },

  /**
   * Position tooltip near the word
   */
  positionTooltip(tooltip, target) {
    const rect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let top = rect.bottom + window.scrollY + 10;
    let left = rect.left + window.scrollX;

    // Keep tooltip on screen
    if (left + tooltipRect.width > window.innerWidth) {
      left = window.innerWidth - tooltipRect.width - 20;
    }

    if (top + tooltipRect.height > window.innerHeight + window.scrollY) {
      top = rect.top + window.scrollY - tooltipRect.height - 10;
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  },

  /**
   * Get insights about a Hebrew word
   */
  async getWordInsights(word) {
    // Remove punctuation (nikud, taamim)
    const cleanWord = word.replace(/[\u0591-\u05C7]/g, '');

    // Check cache first
    const cacheKey = `hebrew_word_${cleanWord}`;
    const cached = await window.SefariaCache.get(cacheKey);
    if (cached) return cached;

    const insights = {
      word: cleanWord,
      gematria: this.calculateGematria(cleanWord),
      root: this.guessRoot(cleanWord),
      meaning: this.guessMeaning(cleanWord),
      references: await this.findReferences(cleanWord),
      frequency: 'common' // Would need API for actual frequency
    };

    // Cache for 7 days
    await window.SefariaCache.set(cacheKey, insights, 'hebrew-words');

    return insights;
  },

  /**
   * Calculate gematria value
   */
  calculateGematria(word) {
    const values = {
      'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9,
      'י': 10, 'כ': 20, 'ך': 20, 'ל': 30, 'מ': 40, 'ם': 40, 'נ': 50, 'ן': 50,
      'ס': 60, 'ע': 70, 'פ': 80, 'ף': 80, 'צ': 90, 'ץ': 90, 'ק': 100,
      'ר': 200, 'ש': 300, 'ת': 400
    };

    let sum = 0;
    for (let char of word) {
      sum += values[char] || 0;
    }

    return sum;
  },

  /**
   * Guess the root of a Hebrew word (simple heuristic)
   */
  guessRoot(word) {
    // Hebrew roots are usually 3 letters
    // This is a simplified version - real implementation would be more complex
    if (word.length >= 3) {
      // Remove common prefixes and suffixes
      let root = word.replace(/^[בכלמהו]/, '') // Prefix letters
                     .replace(/[היםןךות]$/, ''); // Suffix letters

      if (root.length >= 3) {
        return root.substring(0, 3);
      }
    }
    return word;
  },

  /**
   * Guess meaning (would use dictionary API in production)
   */
  guessMeaning(word) {
    // Common words dictionary (simplified)
    const commonWords = {
      'ברא': 'created / bara',
      'אלהים': 'God / Elohim',
      'את': 'the (direct object marker)',
      'השמים': 'the heavens',
      'הארץ': 'the earth',
      'ויהי': 'and it was',
      'אור': 'light',
      'טוב': 'good',
      'יום': 'day',
      'לילה': 'night',
      'מים': 'water',
      'ארץ': 'earth/land',
      'שמים': 'heavens/sky',
      'אדם': 'human/Adam',
      'אישה': 'woman',
      'עץ': 'tree',
      'פרי': 'fruit',
      'חיים': 'life',
      'מלך': 'king',
      'עבד': 'servant/serve',
      'דבר': 'word/thing/speak',
      'עשה': 'do/make',
      'הלך': 'walk/go',
      'בא': 'come',
      'ראה': 'see',
      'שמע': 'hear',
      'אמר': 'say',
      'נתן': 'give',
      'לקח': 'take',
      'ידע': 'know',
      'קרא': 'call/read'
    };

    return commonWords[word] || 'Explore on Sefaria →';
  },

  /**
   * Find references to this word in Sefaria
   */
  async findReferences(word) {
    try {
      // Search Sefaria for this word
      const url = `https://www.sefaria.org/api/name/${encodeURIComponent(word)}`;
      const data = await window.SefariaCache.fetch(url, { category: 'word-search' });

      if (data && data.is_ref) {
        return [{
          text: data.ref,
          url: `https://www.sefaria.org/${data.url}`
        }];
      }
    } catch (error) {
      console.error('Error finding references:', error);
    }

    return [];
  },

  /**
   * Build tooltip HTML
   */
  buildTooltipHTML(word, insights) {
    const { gematria, root, meaning, references } = insights;

    let referencesHTML = '';
    if (references && references.length > 0) {
      referencesHTML = `
        <div class="tooltip-section">
          <strong>📚 Found in:</strong>
          ${references.map(ref => `
            <a href="${ref.url}" target="_blank" class="tooltip-link">${ref.text}</a>
          `).join(', ')}
        </div>
      `;
    }

    return `
      <div class="tooltip-content">
        <div class="tooltip-word">${word}</div>

        <div class="tooltip-section">
          <strong>💡 Meaning:</strong>
          <p>${meaning}</p>
        </div>

        <div class="tooltip-section">
          <strong>🔢 Gematria:</strong>
          <p>${gematria}</p>
        </div>

        ${root !== word ? `
          <div class="tooltip-section">
            <strong>🌱 Root:</strong>
            <p>${root}</p>
          </div>
        ` : ''}

        ${referencesHTML}

        <div class="tooltip-footer">
          <a href="https://www.sefaria.org/search?q=${encodeURIComponent(word)}"
             target="_blank"
             class="tooltip-action">
            Search on Sefaria →
          </a>
        </div>

        <div class="tooltip-hint">
          💡 Click to pin, click again to close
        </div>
      </div>
    `;
  }
};

// Export to window
window.HebrewInsights = HebrewInsights;

console.log('📖 Hebrew word insights system loaded');
