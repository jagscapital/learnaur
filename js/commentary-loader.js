/**
 * ═══════════════════════════════════════════════════════════
 * COMMENTARY LOADER - Phase 2
 * Load and parse Sefaria commentary data
 * Rashi, Ramban, Ibn Ezra, Sforno from downloaded files
 * ═══════════════════════════════════════════════════════════
 */

const CommentaryLoader = {
  cache: new Map(),

  /**
   * Get commentary for a specific verse reference
   * @param {string} commentator - 'rashi', 'ramban', 'ibn-ezra', 'sforno'
   * @param {string} book - 'Genesis', 'Exodus', etc.
   * @param {number} chapter - Chapter number
   * @param {number} verse - Verse number
   */
  async getCommentary(commentator, book, chapter, verse) {
    try {
      // Use Sefaria API with caching
      const reference = `${book}.${chapter}.${verse}`;
      const commentaryName = this.mapCommentatorName(commentator);
      const url = `https://www.sefaria.org/api/texts/${commentaryName}_on_${book}.${chapter}.${verse}`;

      // Use cache-first fetch
      const data = await window.SefariaCache.fetch(url, { category: 'commentary' });

      return this.parseCommentaryData(data, commentator);

    } catch (error) {
      console.error(`Error loading ${commentator} on ${book} ${chapter}:${verse}:`, error);
      return null;
    }
  },

  /**
   * Get ALL commentaries for a verse at once
   */
  async getAllCommentaries(book, chapter, verse) {
    const commentators = ['rashi', 'ramban', 'ibn-ezra', 'sforno'];

    const results = await Promise.allSettled(
      commentators.map(c => this.getCommentary(c, book, chapter, verse))
    );

    const commentaries = {};
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        commentaries[commentators[index]] = result.value;
      }
    });

    return commentaries;
  },

  /**
   * Map our internal names to Sefaria names
   */
  mapCommentatorName(commentator) {
    const mapping = {
      'rashi': 'Rashi',
      'ramban': 'Ramban',
      'ibn-ezra': 'Ibn Ezra',
      'sforno': 'Sforno'
    };
    return mapping[commentator] || commentator;
  },

  /**
   * Parse Sefaria commentary response
   */
  parseCommentaryData(data, commentator) {
    if (!data) return null;

    const parseText = (text) => {
      if (!text) return '';
      if (typeof text === 'string') return text;
      if (Array.isArray(text)) {
        return text.flat(Infinity).filter(t => t && typeof t === 'string').join(' ');
      }
      return '';
    };

    return {
      commentator: this.mapCommentatorName(commentator),
      hebrew: parseText(data.he),
      english: parseText(data.text),
      reference: data.ref || '',
      sections: data.sections || []
    };
  },

  /**
   * Extract key themes from a commentary
   */
  extractThemes(commentary) {
    if (!commentary || !commentary.english) return [];

    const text = commentary.english.toLowerCase();
    const themes = [];

    // Look for common themes
    if (text.includes('faith') || text.includes('believe') || text.includes('trust')) {
      themes.push('Faith');
    }
    if (text.includes('justice') || text.includes('righteous') || text.includes('judgment')) {
      themes.push('Justice');
    }
    if (text.includes('wisdom') || text.includes('understand') || text.includes('knowledge')) {
      themes.push('Wisdom');
    }
    if (text.includes('mercy') || text.includes('compassion') || text.includes('kindness')) {
      themes.push('Mercy');
    }
    if (text.includes('covenant') || text.includes('promise') || text.includes('brit')) {
      themes.push('Covenant');
    }
    if (text.includes('prayer') || text.includes('pray') || text.includes('tefilah')) {
      themes.push('Prayer');
    }
    if (text.includes('repent') || text.includes('teshuvah') || text.includes('return')) {
      themes.push('Repentance');
    }

    return [...new Set(themes)];
  }
};

/**
 * SYNTHESIS ENGINE - Combine multiple commentaries into ONE teaching
 */
const CommentarySynthesizer = {

  /**
   * Synthesize main teaching from all classical commentaries
   */
  synthesizeMainTeaching(commentaries) {
    if (!commentaries || Object.keys(commentaries).length === 0) {
      return {
        text: "Commentary synthesis in progress. Check back soon for deep insights.",
        sources: []
      };
    }

    let synthesis = [];
    const sources = [];

    // Start with Rashi (פשט - simple meaning)
    if (commentaries.rashi && commentaries.rashi.english) {
      synthesis.push(`<p><strong>The Simple Meaning:</strong> ${this.cleanText(commentaries.rashi.english)}</p>`);
      sources.push({ name: 'Rashi', type: 'Classical Commentary' });
    }

    // Add Ramban (depth and mysticism)
    if (commentaries.ramban && commentaries.ramban.english) {
      const rambanText = this.cleanText(commentaries.ramban.english);
      if (rambanText.length > 50) { // Only add if substantial
        synthesis.push(`<p><strong>Deeper Dimensions:</strong> ${rambanText}</p>`);
        sources.push({ name: 'Ramban (Nachmanides)', type: 'Mystical Commentary' });
      }
    }

    // Add Ibn Ezra (grammar and reason)
    if (commentaries['ibn-ezra'] && commentaries['ibn-ezra'].english) {
      const ibnEzraText = this.cleanText(commentaries['ibn-ezra'].english);
      if (ibnEzraText.length > 50) {
        synthesis.push(`<p><strong>Rational Analysis:</strong> ${ibnEzraText}</p>`);
        sources.push({ name: 'Ibn Ezra', type: 'Grammatical Commentary' });
      }
    }

    // Add Sforno (ethical focus)
    if (commentaries.sforno && commentaries.sforno.english) {
      const sfornoText = this.cleanText(commentaries.sforno.english);
      if (sfornoText.length > 50) {
        synthesis.push(`<p><strong>Ethical Teaching:</strong> ${sfornoText}</p>`);
        sources.push({ name: 'Sforno', type: 'Ethical Commentary' });
      }
    }

    return {
      text: synthesis.join('\n'),
      sources: sources
    };
  },

  /**
   * Generate practical wisdom from commentaries
   */
  synthesizePracticalWisdom(commentaries) {
    const themes = [];
    Object.values(commentaries).forEach(c => {
      if (c) themes.push(...CommentaryLoader.extractThemes(c));
    });

    const uniqueThemes = [...new Set(themes)];

    if (uniqueThemes.length === 0) {
      return {
        text: "The wisdom of this verse applies to building character, strengthening relationships, and deepening our connection to the Divine.",
        themes: []
      };
    }

    let wisdom = `<p>This verse teaches us about <strong>${uniqueThemes.join(', ')}</strong>. `;

    // Add theme-specific wisdom
    if (uniqueThemes.includes('Faith')) {
      wisdom += "In our daily lives, we can strengthen our faith by trusting in the Divine plan even when we don't understand. ";
    }
    if (uniqueThemes.includes('Justice')) {
      wisdom += "We're called to act justly in all our dealings, treating every person with fairness and dignity. ";
    }
    if (uniqueThemes.includes('Wisdom')) {
      wisdom += "Seek wisdom through study, reflection, and learning from those who came before us. ";
    }
    if (uniqueThemes.includes('Mercy')) {
      wisdom += "Practice compassion in your relationships, giving others the benefit of the doubt. ";
    }

    wisdom += "</p>";

    return {
      text: wisdom,
      themes: uniqueThemes
    };
  },

  /**
   * Generate discussion questions
   */
  generateDiscussionQuestions(commentaries) {
    const questions = [];

    // Always include these foundational questions
    questions.push("What is the simple meaning (פשט) of this verse?");
    questions.push("How does this verse apply to your life today?");

    // Add theme-specific questions based on commentaries
    const themes = [];
    Object.values(commentaries).forEach(c => {
      if (c) themes.push(...CommentaryLoader.extractThemes(c));
    });

    if (themes.includes('Faith')) {
      questions.push("What does this verse teach about trust and faith?");
    }
    if (themes.includes('Justice')) {
      questions.push("How can we apply this teaching about justice in our modern world?");
    }
    if (themes.includes('Wisdom')) {
      questions.push("What deeper wisdom might be hidden in these words?");
    }

    // Add comparative questions if we have multiple commentators
    if (Object.keys(commentaries).length > 1) {
      questions.push("How do the different commentators view this verse differently?");
    }

    return questions.slice(0, 5); // Max 5 questions
  },

  /**
   * Clean and format text
   */
  cleanText(text) {
    if (!text) return '';

    return text
      .replace(/<[^>]+>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .slice(0, 500); // Limit length
  }
};

// Export to window
window.CommentaryLoader = CommentaryLoader;
window.CommentarySynthesizer = CommentarySynthesizer;
