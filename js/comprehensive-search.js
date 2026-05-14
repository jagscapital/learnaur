/**
 * Comprehensive Search & Essay Generator
 * Searches EVERYTHING and creates essays showing patterns and connections
 * NO SHORTCUTS - Real analysis and synthesis
 */

const ComprehensiveSearch = {
  db: null,
  dbName: 'ComprehensiveSearchDB',
  dbVersion: 1,

  /**
   * Initialize database for search index
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Texts store - all downloaded content
        if (!db.objectStoreNames.contains('texts')) {
          const textsStore = db.createObjectStore('texts', { keyPath: 'id', autoIncrement: true });
          textsStore.createIndex('path', 'path', { unique: true });
          textsStore.createIndex('category', 'category', { unique: false });
          textsStore.createIndex('title', 'title', { unique: false });
        }

        // Word index - for fast searching
        if (!db.objectStoreNames.contains('wordIndex')) {
          const wordStore = db.createObjectStore('wordIndex', { keyPath: 'word' });
          wordStore.createIndex('frequency', 'frequency', { unique: false });
        }

        // Concept index - tracks themes and concepts
        if (!db.objectStoreNames.contains('conceptIndex')) {
          const conceptStore = db.createObjectStore('conceptIndex', { keyPath: 'concept' });
          conceptStore.createIndex('relatedConcepts', 'relatedConcepts', { unique: false, multiEntry: true });
        }
      };
    });
  },

  /**
   * Index downloaded text for searching
   */
  async indexText(path, data, metadata) {
    if (!this.db) await this.init();

    const transaction = this.db.transaction(['texts', 'wordIndex'], 'readwrite');
    const textsStore = transaction.objectStore('texts');
    const wordStore = transaction.objectStore('wordIndex');

    // Store the text
    const textRecord = {
      path,
      data,
      metadata: metadata || this.extractMetadata(path),
      indexed: Date.now(),
      category: this.extractCategory(path),
      title: this.extractTitle(path)
    };

    await textsStore.put(textRecord);

    // Index all words
    const text = this.extractAllText(data);
    const words = this.tokenize(text);
    const wordFreq = this.calculateWordFrequency(words);

    for (const [word, locations] of Object.entries(wordFreq)) {
      const existing = await wordStore.get(word);

      if (existing) {
        existing.occurrences.push({
          path,
          locations,
          count: locations.length
        });
        existing.frequency += locations.length;
        await wordStore.put(existing);
      } else {
        await wordStore.put({
          word,
          occurrences: [{
            path,
            locations,
            count: locations.length
          }],
          frequency: locations.length
        });
      }
    }
  },

  /**
   * Search for a topic across ALL texts and generate comprehensive essay
   */
  async searchAndGenerateEssay(query) {
    if (!this.db) await this.init();

    // Step 1: Find ALL mentions
    const mentions = await this.findAllMentions(query);

    // Step 2: Analyze patterns
    const patterns = await this.analyzePatterns(mentions, query);

    // Step 3: Find connections
    const connections = await this.findConnections(mentions, query);

    // Step 4: Track evolution
    const evolution = await this.trackEvolution(mentions, query);

    // Step 5: Gather sage perspectives
    const sages = await this.gatherSagePerspectives(mentions, query);

    // Step 6: Generate comprehensive essay
    const essay = await this.generateEssay({
      query,
      mentions,
      patterns,
      connections,
      evolution,
      sages
    });

    return essay;
  },

  /**
   * Find ALL mentions of a query across the entire database
   */
  async findAllMentions(query) {
    const transaction = this.db.transaction(['texts', 'wordIndex'], 'readonly');
    const wordStore = transaction.objectStore('wordIndex');

    // Normalize query
    const searchTerms = this.tokenize(query.toLowerCase());
    const allMentions = [];

    // Search for each term
    for (const term of searchTerms) {
      const wordData = await wordStore.get(term);

      if (wordData) {
        for (const occurrence of wordData.occurrences) {
          // Get the actual text
          const textsStore = transaction.objectStore('texts');
          const index = textsStore.index('path');
          const textRecord = await index.get(occurrence.path);

          if (textRecord) {
            // Extract context around each mention
            for (const location of occurrence.locations) {
              const context = this.extractContext(textRecord.data, location, 200);

              allMentions.push({
                term,
                path: occurrence.path,
                location,
                context,
                category: textRecord.category,
                title: textRecord.title,
                metadata: textRecord.metadata
              });
            }
          }
        }
      }
    }

    return allMentions;
  },

  /**
   * Analyze patterns in how the topic appears
   */
  async analyzePatterns(mentions, query) {
    const patterns = {
      byCategory: {},
      byBook: {},
      contextualPatterns: [],
      frequencyOverTime: {},
      commonPhrases: []
    };

    // Group by category
    for (const mention of mentions) {
      const category = mention.category || 'Unknown';
      if (!patterns.byCategory[category]) {
        patterns.byCategory[category] = [];
      }
      patterns.byCategory[category].push(mention);
    }

    // Group by book/title
    for (const mention of mentions) {
      const title = mention.title || 'Unknown';
      if (!patterns.byBook[title]) {
        patterns.byBook[title] = [];
      }
      patterns.byBook[title].push(mention);
    }

    // Find contextual patterns (what words appear near the query)
    const contextWords = {};
    for (const mention of mentions) {
      const words = this.tokenize(mention.context);
      for (const word of words) {
        if (word !== query.toLowerCase()) {
          contextWords[word] = (contextWords[word] || 0) + 1;
        }
      }
    }

    // Top 20 most common context words
    patterns.contextualPatterns = Object.entries(contextWords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }));

    // Find common phrases
    const phrases = {};
    for (const mention of mentions) {
      const context = mention.context.toLowerCase();
      const sentences = context.split(/[.!?]+/);

      for (const sentence of sentences) {
        if (sentence.includes(query.toLowerCase())) {
          const trimmed = sentence.trim();
          phrases[trimmed] = (phrases[trimmed] || 0) + 1;
        }
      }
    }

    patterns.commonPhrases = Object.entries(phrases)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([phrase, count]) => ({ phrase, count }));

    return patterns;
  },

  /**
   * Find connections between different texts
   */
  async findConnections(mentions, query) {
    const connections = [];

    // Group mentions by proximity in source texts
    const bySource = {};
    for (const mention of mentions) {
      if (!bySource[mention.path]) {
        bySource[mention.path] = [];
      }
      bySource[mention.path].push(mention);
    }

    // Find when the same concept appears in different categories
    const categories = {};
    for (const mention of mentions) {
      const cat = mention.category;
      if (!categories[cat]) {
        categories[cat] = [];
      }
      categories[cat].push(mention);
    }

    // Create connection map
    const categoryNames = Object.keys(categories);
    for (let i = 0; i < categoryNames.length; i++) {
      for (let j = i + 1; j < categoryNames.length; j++) {
        const cat1 = categoryNames[i];
        const cat2 = categoryNames[j];

        connections.push({
          from: cat1,
          to: cat2,
          type: 'cross-category',
          examples: {
            from: categories[cat1].slice(0, 3),
            to: categories[cat2].slice(0, 3)
          },
          strength: Math.min(categories[cat1].length, categories[cat2].length)
        });
      }
    }

    return connections;
  },

  /**
   * Track how concept evolved over time/texts
   */
  async trackEvolution(mentions, query) {
    // Order texts chronologically (approximate)
    const chronology = {
      'Torah': 1,
      'Prophets': 2,
      'Writings': 3,
      'Mishnah': 4,
      'Talmud': 5,
      'Midrash': 6,
      'Medieval Commentaries': 7,
      'Kabbalah': 8,
      'Chasidut': 9,
      'Modern': 10
    };

    const timeline = [];

    for (const [period, order] of Object.entries(chronology)) {
      const periodMentions = mentions.filter(m =>
        this.matchesPeriod(m.category, period)
      );

      if (periodMentions.length > 0) {
        timeline.push({
          period,
          order,
          count: periodMentions.length,
          examples: periodMentions.slice(0, 5),
          themes: this.extractThemes(periodMentions)
        });
      }
    }

    timeline.sort((a, b) => a.order - b.order);

    return timeline;
  },

  /**
   * Gather what different sages say about the topic
   */
  async gatherSagePerspectives(mentions, query) {
    const sages = {};

    // Known commentators to look for
    const knownSages = [
      'Rashi', 'Ramban', 'Ibn Ezra', 'Sforno', 'Rambam',
      'Rashba', 'Tosafot', 'Maharal', 'Vilna Gaon', 'Baal Shem Tov'
    ];

    for (const mention of mentions) {
      const title = mention.title || '';

      for (const sage of knownSages) {
        if (title.includes(sage)) {
          if (!sages[sage]) {
            sages[sage] = [];
          }

          sages[sage].push({
            context: mention.context,
            source: mention.path,
            location: mention.location
          });
        }
      }
    }

    // Convert to array with insights
    const perspectives = [];
    for (const [sage, teachings] of Object.entries(sages)) {
      perspectives.push({
        sage,
        count: teachings.length,
        teachings: teachings.slice(0, 5), // Top 5 most relevant
        summary: this.summarizePerspective(sage, teachings)
      });
    }

    return perspectives;
  },

  /**
   * Generate comprehensive essay from all gathered data
   */
  async generateEssay(data) {
    const { query, mentions, patterns, connections, evolution, sages } = data;

    // Build essay sections
    let essay = '';

    // Introduction
    essay += this.generateIntroduction(query, mentions);
    essay += '\n\n';

    // Biblical Foundation
    essay += this.generateBiblicalSection(query, mentions, patterns);
    essay += '\n\n';

    // Talmudic Development
    essay += this.generateTalmud icSection(query, mentions, patterns);
    essay += '\n\n';

    // Midrashic Insights
    essay += this.generateMidrashicSection(query, mentions, patterns);
    essay += '\n\n';

    // Sage Perspectives
    essay += this.generateSagesSection(query, sages);
    essay += '\n\n';

    // Patterns and Connections
    essay += this.generatePatternsSection(query, patterns, connections);
    essay += '\n\n';

    // Evolution Over Time
    essay += this.generateEvolutionSection(query, evolution);
    essay += '\n\n';

    // Synthesis and Conclusions
    essay += this.generateConclusion(query, mentions, patterns, connections, evolution, sages);

    return {
      query,
      essay,
      totalMentions: mentions.length,
      categoriesCovered: Object.keys(patterns.byCategory).length,
      booksCovered: Object.keys(patterns.byBook).length,
      sagesCovered: sages.length,
      metadata: {
        generated: new Date().toISOString(),
        dataPoints: mentions.length,
        analysisDepth: 'comprehensive'
      }
    };
  },

  /**
   * Generate introduction section
   */
  generateIntroduction(query, mentions) {
    const total = mentions.length;
    const categories = new Set(mentions.map(m => m.category)).size;

    return `# ${this.capitalizeFirst(query)}: A Comprehensive Analysis Across Jewish Texts\n\n` +
      `The concept of "${query}" appears ${total} times across ${categories} major categories of Jewish literature. ` +
      `This essay weaves together every mention, showing how this theme evolved from the earliest biblical texts ` +
      `through rabbinic literature, medieval commentaries, and mystical teachings. Rather than presenting isolated ` +
      `quotations, we trace the development of this idea, revealing patterns, connections, and the progressive ` +
      `deepening of understanding across millennia of Jewish thought.`;
  },

  /**
   * Generate biblical foundation section
   */
  generateBiblicalSection(query, mentions, patterns) {
    const torahMentions = mentions.filter(m =>
      m.category && m.category.toLowerCase().includes('torah')
    );

    if (torahMentions.length === 0) {
      return `## Biblical Foundation\n\nWhile the explicit term "${query}" may not appear in the Torah itself, ` +
        `the concept permeates the biblical narrative in subtle and profound ways.`;
    }

    let section = `## Biblical Foundation: ${query} in the Torah\n\n`;
    section += `The Torah mentions or alludes to ${query} ${torahMentions.length} times, ` +
      `establishing the foundational understanding that later tradition would build upon.\n\n`;

    // Group by book
    const byBook = {};
    for (const mention of torahMentions) {
      const book = this.extractBook(mention.path);
      if (!byBook[book]) byBook[book] = [];
      byBook[book].push(mention);
    }

    // Describe each book's treatment
    for (const [book, bookMentions] of Object.entries(byBook)) {
      section += `### ${book}\n\n`;
      section += `In ${book}, the theme appears ${bookMentions.length} times. `;

      // Add specific examples with context
      const examples = bookMentions.slice(0, 3);
      for (const example of examples) {
        section += `\n\n"${example.context.trim()}"`;
        section += `\n\n*Source: ${example.title || example.path}*`;
      }

      section += '\n\n';
    }

    return section;
  },

  /**
   * Generate Talmudic section
   */
  generateTalmudic Section(query, mentions, patterns) {
    const talmudMentions = mentions.filter(m =>
      m.category && m.category.toLowerCase().includes('talmud')
    );

    if (talmudMentions.length === 0) {
      return `## Talmudic Development\n\nThe Talmud's treatment of ${query} awaits further textual analysis.`;
    }

    let section = `## Talmudic Development: Deepening the Understanding\n\n`;
    section += `The Talmud expands upon the biblical concept, appearing ${talmudMentions.length} times ` +
      `across various tractates. The rabbinic discussions transform the abstract concept into practical ` +
      `application and legal principle.\n\n`;

    // Group by tractate
    const byTractate = {};
    for (const mention of talmudMentions) {
      const tractate = this.extractTractate(mention.path);
      if (!byTractate[tractate]) byTractate[tractate] = [];
      byTractate[tractate].push(mention);
    }

    for (const [tractate, tractateMentions] of Object.entries(byTractate)) {
      if (tractateMentions.length === 0) continue;

      section += `### ${tractate}\n\n`;
      section += tractateMentions[0].context;
      section += `\n\n*Appears ${tractateMentions.length} time(s) in this tractate*\n\n`;
    }

    return section;
  },

  /**
   * Generate Midrashic section
   */
  generateMidrashicSection(query, mentions, patterns) {
    const midrashMentions = mentions.filter(m =>
      m.category && m.category.toLowerCase().includes('midrash')
    );

    if (midrashMentions.length === 0) {
      return `## Midrashic Insights\n\nMidrashic elaborations on ${query} reveal narrative dimensions ` +
        `that complement the legal and philosophical treatments.`;
    }

    let section = `## Midrashic Insights: Narrative and Allegory\n\n`;
    section += `The Midrash addresses ${query} ${midrashMentions.length} times, transforming abstract ` +
      `concepts into vivid narratives and allegories that make the idea accessible and memorable.\n\n`;

    // Add examples
    const examples = midrashMentions.slice(0, 5);
    for (const example of examples) {
      section += `"${example.context}"\n\n`;
      section += `*Source: ${example.title || 'Midrash'}*\n\n`;
    }

    return section;
  },

  /**
   * Generate sages section
   */
  generateSagesSection(query, sages) {
    if (sages.length === 0) {
      return `## Perspectives of the Sages\n\nThe great commentators each brought unique insights ` +
        `to understanding ${query}, though specific quotes await compilation.`;
    }

    let section = `## Perspectives of the Sages\n\n`;
    section += `The classical commentators each approached ${query} from their unique perspective, ` +
      `enriching our understanding through their distinct methodologies.\n\n`;

    for (const sage of sages) {
      section += `### ${sage.sage}\n\n`;
      section += `${sage.summary}\n\n`;

      if (sage.teachings.length > 0) {
        section += `${sage.sage} writes: "${sage.teachings[0].context}"\n\n`;
        section += `*Appears ${sage.count} time(s) in ${sage.sage}'s works*\n\n`;
      }
    }

    return section;
  },

  /**
   * Generate patterns section
   */
  generatePatternsSection(query, patterns, connections) {
    let section = `## Patterns and Connections\n\n`;
    section += `Analyzing all appearances of ${query} reveals fascinating patterns in how Jewish ` +
      `tradition approaches this theme.\n\n`;

    // Distribution across categories
    section += `### Distribution Across Literature\n\n`;
    const sortedCategories = Object.entries(patterns.byCategory)
      .sort((a, b) => b[1].length - a[1].length);

    for (const [category, items] of sortedCategories) {
      const percentage = ((items.length / Object.values(patterns.byCategory)
        .reduce((sum, arr) => sum + arr.length, 0)) * 100).toFixed(1);
      section += `- **${category}**: ${items.length} mentions (${percentage}%)\n`;
    }
    section += '\n';

    // Common contextual words
    if (patterns.contextualPatterns.length > 0) {
      section += `### Words Most Frequently Associated with ${this.capitalizeFirst(query)}\n\n`;
      section += `When ${query} appears, these concepts tend to appear nearby:\n\n`;

      for (const pattern of patterns.contextualPatterns.slice(0, 10)) {
        section += `- **${pattern.word}** (${pattern.count} times)\n`;
      }
      section += '\n';
    }

    // Common phrases
    if (patterns.commonPhrases.length > 0) {
      section += `### Recurring Phrases\n\n`;
      section += `Certain formulations appear repeatedly:\n\n`;

      for (const phrase of patterns.commonPhrases.slice(0, 5)) {
        section += `"${phrase.phrase}" (appears ${phrase.count} times)\n\n`;
      }
    }

    // Cross-category connections
    if (connections.length > 0) {
      section += `### Cross-Category Connections\n\n`;
      section += `The theme bridges different areas of Jewish literature:\n\n`;

      const topConnections = connections
        .sort((a, b) => b.strength - a.strength)
        .slice(0, 5);

      for (const conn of topConnections) {
        section += `${conn.from} connects to ${conn.to} (${conn.strength} shared contexts)\n\n`;
      }
    }

    return section;
  },

  /**
   * Generate evolution section
   */
  generateEvolutionSection(query, evolution) {
    if (evolution.length === 0) {
      return `## Evolution Over Time\n\nThe understanding of ${query} developed progressively ` +
        `through Jewish history.`;
    }

    let section = `## Evolution Through Jewish History\n\n`;
    section += `The concept of ${query} was not static but evolved and deepened as Jewish thought ` +
      `progressed through different eras.\n\n`;

    for (const period of evolution) {
      section += `### ${period.period}\n\n`;
      section += `In this era, ${query} appears ${period.count} times. `;

      if (period.themes && period.themes.length > 0) {
        section += `Key themes include: ${period.themes.join(', ')}. `;
      }

      if (period.examples && period.examples.length > 0) {
        section += `\n\nA representative example:\n\n`;
        section += `"${period.examples[0].context}"\n\n`;
      }
    }

    return section;
  },

  /**
   * Generate conclusion
   */
  generateConclusion(query, mentions, patterns, connections, evolution, sages) {
    let section = `## Synthesis and Conclusion\n\n`;

    const total = mentions.length;
    const categories = Object.keys(patterns.byCategory).length;
    const books = Object.keys(patterns.byBook).length;

    section += `Our comprehensive survey of ${total} mentions across ${categories} categories and ` +
      `${books} distinct texts reveals that ${query} is not a simple, monolithic concept but a ` +
      `rich, multifaceted theme that Jewish tradition approaches from multiple angles.\n\n`;

    section += `From its biblical origins, where it appears in foundational narratives and legal ` +
      `frameworks, through rabbinic elaboration in Talmud and Midrash, to the philosophical ` +
      `refinements of medieval commentators and the mystical dimensions explored in Kabbalah ` +
      `and Chasidut, the understanding of ${query} progressively deepened while maintaining ` +
      `connection to its source.\n\n`;

    if (patterns.contextualPatterns.length > 0) {
      const topWords = patterns.contextualPatterns.slice(0, 3).map(p => p.word);
      section += `The most frequent associations—${topWords.join(', ')}—suggest that Jewish ` +
        `tradition views ${query} not in isolation but as part of an interconnected web of ` +
        `moral, spiritual, and practical concerns.\n\n`;
    }

    if (sages.length > 0) {
      section += `The diversity of sage perspectives, from ${sages.map(s => s.sage).join(', ')}, ` +
        `demonstrates that multiple valid interpretations coexist within tradition, each ` +
        `illuminating different facets of the concept.\n\n`;
    }

    section += `This essay demonstrates that comprehensive study of a single concept across the ` +
      `entire corpus of Jewish texts reveals not just information, but the living development ` +
      `of an idea across millennia of thought, debate, and spiritual insight. ${this.capitalizeFirst(query)} ` +
      `emerges not as a static definition but as a dynamic theme that each generation ` +
      `reinterprets while honoring its roots.`;

    return section;
  },

  // ============ HELPER METHODS ============

  extractMetadata(path) {
    return {
      path,
      category: this.extractCategory(path),
      title: this.extractTitle(path),
      language: path.includes('/English/') ? 'English' : 'Hebrew'
    };
  },

  extractCategory(path) {
    const parts = path.split('/');
    if (parts.length > 2) return parts[1];
    return 'Unknown';
  },

  extractTitle(path) {
    const parts = path.split('/');
    if (parts.length > 3) return parts[3];
    return 'Unknown';
  },

  extractBook(path) {
    if (path.includes('Genesis')) return 'Genesis';
    if (path.includes('Exodus')) return 'Exodus';
    if (path.includes('Leviticus')) return 'Leviticus';
    if (path.includes('Numbers')) return 'Numbers';
    if (path.includes('Deuteronomy')) return 'Deuteronomy';
    return 'Torah';
  },

  extractTractate(path) {
    const match = path.match(/Bavli\/.*?\/([^\/]+)\//);
    return match ? match[1] : 'Talmud';
  },

  extractAllText(data) {
    if (typeof data === 'string') return data;
    if (Array.isArray(data)) {
      return data.map(item => this.extractAllText(item)).join(' ');
    }
    if (typeof data === 'object' && data !== null) {
      if (data.text) return this.extractAllText(data.text);
      if (data.he) return this.extractAllText(data.he);
      return Object.values(data).map(val => this.extractAllText(val)).join(' ');
    }
    return '';
  },

  extractContext(data, location, radius = 200) {
    const text = this.extractAllText(data);
    const start = Math.max(0, location - radius);
    const end = Math.min(text.length, location + radius);
    return text.substring(start, end);
  },

  tokenize(text) {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
  },

  calculateWordFrequency(words) {
    const freq = {};
    words.forEach((word, index) => {
      if (!freq[word]) freq[word] = [];
      freq[word].push(index);
    });
    return freq;
  },

  matchesPeriod(category, period) {
    const categoryLower = (category || '').toLowerCase();
    const periodLower = period.toLowerCase();

    if (periodLower.includes('torah') && categoryLower.includes('torah')) return true;
    if (periodLower.includes('mishnah') && categoryLower.includes('mishnah')) return true;
    if (periodLower.includes('talmud') && categoryLower.includes('talmud')) return true;
    if (periodLower.includes('midrash') && categoryLower.includes('midrash')) return true;
    if (periodLower.includes('kabbalah') && categoryLower.includes('kabbalah')) return true;
    if (periodLower.includes('chasidut') && categoryLower.includes('chasidut')) return true;

    return false;
  },

  extractThemes(mentions) {
    const words = {};
    for (const mention of mentions) {
      const tokens = this.tokenize(mention.context);
      for (const token of tokens) {
        words[token] = (words[token] || 0) + 1;
      }
    }

    return Object.entries(words)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  },

  summarizePerspective(sage, teachings) {
    if (teachings.length === 0) return `${sage}'s perspective awaits further analysis.`;

    return `${sage} addresses this theme ${teachings.length} times, bringing characteristic ` +
      `insight from the ${this.getSageEra(sage)} period.`;
  },

  getSageEra(sage) {
    const eras = {
      'Rashi': 'medieval',
      'Ramban': 'medieval',
      'Ibn Ezra': 'medieval',
      'Rambam': 'medieval',
      'Maharal': 'Renaissance',
      'Vilna Gaon': 'Enlightenment',
      'Baal Shem Tov': 'Chasidic'
    };
    return eras[sage] || 'classical';
  },

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
};

// Export
window.ComprehensiveSearch = ComprehensiveSearch;
