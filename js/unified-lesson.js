/**
 * ═══════════════════════════════════════════════════════════
 * UNIFIED LESSON BUILDER
 * Combines ALL sources into ONE cohesive teaching
 * No separate cards - everything mushed together
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Build complete unified lesson for a verse/section
 * Fetches from ALL sources and synthesizes into ONE teaching
 */
async function buildUnifiedLesson(reference) {
  const container = document.getElementById('unifiedLessonContainer') || createLessonContainer();

  // Show loading state
  container.innerHTML = DOMPurify.sanitize(`
    <div class="unified-lesson-loading">
      <div class="loading-spinner"></div>
      <p>Gathering all sources...</p>
      <p class="loading-sources">Fetching Torah text, Rashi, Ramban, Ibn Ezra, Gemara, Midrash, Kabbalah, Chassidus...</p>
    </div>
  `);

  try {
    // Fetch ALL data in parallel
    const [
      torahText,
      commentaries,
      crossRefs,
      connections
    ] = await Promise.all([
      fetchTorahText(reference),
      fetchCommentaries(reference),
      fetchCrossReferences(reference),
      fetchConnections(reference)
    ]);

    // Build unified lesson
    const lesson = synthesizeLesson({
      reference,
      torahText,
      commentaries,
      crossRefs,
      connections
    });

    // Display
    displayUnifiedLesson(lesson, container);

  } catch (error) {
    console.error('Error building unified lesson:', error);
    showLessonError(container, reference);
  }
}

/**
 * Synthesize all data into ONE flowing lesson
 */
function synthesizeLesson(data) {
  const { reference, torahText, commentaries, crossRefs, connections } = data;

  // Organize commentaries by type
  const classical = commentaries.filter(c => ['Rashi', 'Ramban', 'Ibn Ezra', 'Sforno'].some(name => c.source.includes(name)));
  const talmudic = crossRefs.gemara || [];
  const midrashic = crossRefs.midrash || [];
  const kabbalistic = commentaries.filter(c => c.source.includes('Zohar') || c.source.includes('Kabbalah'));
  const chassidic = commentaries.filter(c => c.source.includes('Chassid') || c.source.includes('Rebbe') || c.source.includes('Baal Shem'));

  return {
    reference,
    verse: torahText,

    // SYNTHESIZED EXPLANATIONS (not separate cards!)
    mainTeaching: synthesizeMainTeaching(classical, torahText),
    legalDimensions: synthesizeLegalTeaching(talmudic, classical),
    deeperLayers: synthesizeDeeperTeaching(midrashic, kabbalistic, chassidic),
    practicalApplication: synthesizePracticalWisdom(classical, chassidic),
    discussionQuestions: generateDiscussionQuestions(classical, midrashic, chassidic),

    // Source attribution (at bottom)
    sources: {
      classical: classical.map(c => ({ name: c.source, link: c.reference })),
      talmudic: talmudic.map(c => ({ name: c.source, link: c.reference })),
      midrashic: midrashic.map(c => ({ name: c.source, link: c.reference })),
      mystical: [...kabbalistic, ...chassidic].map(c => ({ name: c.source, link: c.reference }))
    }
  };
}

/**
 * Synthesize main teaching from classical commentaries
 * Combines Rashi + Ramban + Ibn Ezra + Sforno into ONE explanation
 */
function synthesizeMainTeaching(commentaries, torahText) {
  if (!commentaries || commentaries.length === 0) {
    return "This verse contains profound wisdom. Commentary synthesis in progress.";
  }

  let synthesis = "";

  // Start with literal meaning
  const literal = commentaries.find(c => c.source.includes('Rashi') || c.source.includes('Rashbam'));
  if (literal) {
    synthesis += `The verse means: ${extractMeaning(literal.english || literal.hebrew)}. `;
  }

  // Add deeper interpretations
  const deeper = commentaries.filter(c => c.source.includes('Ramban') || c.source.includes('Sforno'));
  if (deeper.length > 0) {
    synthesis += `\n\nLooking deeper: `;
    deeper.forEach((comm, idx) => {
      const meaning = extractMeaning(comm.english || comm.hebrew);
      synthesis += meaning;
      if (idx < deeper.length - 1) synthesis += " Additionally, ";
    });
  }

  // Add philosophical dimensions
  const philosophical = commentaries.filter(c => c.source.includes('Ibn Ezra'));
  if (philosophical.length > 0) {
    synthesis += `\n\nPhilosophically: ${extractMeaning(philosophical[0].english || philosophical[0].hebrew)}`;
  }

  return synthesis || "The commentators explore this verse from multiple angles, each revealing different facets of its meaning.";
}

/**
 * Synthesize legal/Talmudic teaching
 */
function synthesizeLegalTeaching(talmudic, classical) {
  if (!talmudic || talmudic.length === 0) {
    return null; // Don't show section if no content
  }

  let synthesis = "The Talmud explores the practical implications: ";

  talmudic.slice(0, 3).forEach((ref, idx) => {
    const text = extractMeaning(ref.english || ref.hebrew || "");
    if (text) {
      if (idx > 0) synthesis += " Furthermore, ";
      synthesis += `${ref.source} discusses ${text}`;
    }
  });

  return synthesis;
}

/**
 * Synthesize deeper layers (Midrash + Kabbalah + Chassidus)
 */
function synthesizeDeeperTeaching(midrashic, kabbalistic, chassidic) {
  let synthesis = "";

  // Midrashic layer
  if (midrashic && midrashic.length > 0) {
    synthesis += "The Midrash reveals hidden dimensions: ";
    const text = extractMeaning(midrashic[0].english || midrashic[0].hebrew || "");
    synthesis += text;
  }

  // Kabbalistic layer
  if (kabbalistic && kabbalistic.length > 0) {
    if (synthesis) synthesis += "\n\n";
    synthesis += "The mystical tradition teaches: ";
    const text = extractMeaning(kabbalistic[0].english || kabbalistic[0].hebrew || "");
    synthesis += text;
  }

  // Chassidic layer
  if (chassidic && chassidic.length > 0) {
    if (synthesis) synthesis += "\n\n";
    synthesis += "Chassidic wisdom illuminates: ";
    const text = extractMeaning(chassidic[0].english || chassidic[0].hebrew || "");
    synthesis += text;
  }

  return synthesis || null;
}

/**
 * Synthesize practical application
 */
function synthesizePracticalWisdom(classical, chassidic) {
  let wisdom = "In our lives today, this teaches us: ";

  // Extract practical lessons from commentaries
  const lessons = [];

  classical.forEach(c => {
    if (c.modernApplication) lessons.push(c.modernApplication);
    if (c.whyMatters) lessons.push(c.whyMatters);
  });

  chassidic.forEach(c => {
    if (c.english && c.english.includes('life') || c.english && c.english.includes('today')) {
      lessons.push(extractMeaning(c.english));
    }
  });

  if (lessons.length > 0) {
    wisdom += lessons.join(' ');
  } else {
    wisdom += "We can apply these eternal teachings to navigate our challenges with wisdom, faith, and moral clarity.";
  }

  return wisdom;
}

/**
 * Generate discussion questions
 */
function generateDiscussionQuestions(classical, midrashic, chassidic) {
  const questions = [];

  // Extract from existing data
  classical.forEach(c => {
    if (c.questions && Array.isArray(c.questions)) {
      questions.push(...c.questions);
    }
  });

  // Generate synthesis questions
  questions.push("How do the different commentators' perspectives complement each other?");
  questions.push("What makes this teaching relevant to our generation?");
  questions.push("How can we integrate this wisdom into daily practice?");

  return questions.slice(0, 5); // Limit to 5
}

/**
 * Extract meaningful text from commentary
 */
function extractMeaning(text) {
  if (!text) return "";

  // Clean up text
  let clean = text
    .replace(/\[.*?\]/g, '') // Remove brackets
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .trim();

  // Limit length
  if (clean.length > 400) {
    clean = clean.substring(0, 400) + "...";
  }

  return clean;
}

/**
 * Display unified lesson (ONE flowing document)
 */
function displayUnifiedLesson(lesson, container) {
  const html = `
    <div class="unified-lesson">
      <!-- Header -->
      <div class="lesson-header">
        <h2 class="lesson-reference">${lesson.reference}</h2>
        <div class="lesson-source-badge">Complete Teaching • All Sources Synthesized</div>
      </div>

      <!-- The Verse -->
      <section class="lesson-section verse-section">
        <h3 class="section-icon-title"><span class="section-icon">📖</span> The Verse</h3>
        <div class="verse-display">
          ${lesson.verse.hebrew ? `<div class="verse-hebrew">${lesson.verse.hebrew}</div>` : ''}
          <div class="verse-english">${lesson.verse.english || lesson.verse.text || ''}</div>
        </div>
      </section>

      <!-- Main Teaching -->
      <section class="lesson-section main-teaching-section">
        <h3 class="section-icon-title"><span class="section-icon">💭</span> What It Means</h3>
        <div class="teaching-text">
          ${formatTeachingText(lesson.mainTeaching)}
        </div>
      </section>

      <!-- Legal Dimensions -->
      ${lesson.legalDimensions ? `
        <section class="lesson-section legal-section">
          <h3 class="section-icon-title"><span class="section-icon">⚖️</span> Legal & Practical Dimensions</h3>
          <div class="teaching-text">
            ${formatTeachingText(lesson.legalDimensions)}
          </div>
        </section>
      ` : ''}

      <!-- Deeper Layers -->
      ${lesson.deeperLayers ? `
        <section class="lesson-section mystical-section">
          <h3 class="section-icon-title"><span class="section-icon">✨</span> Deeper Layers</h3>
          <div class="teaching-text">
            ${formatTeachingText(lesson.deeperLayers)}
          </div>
        </section>
      ` : ''}

      <!-- Practical Application -->
      <section class="lesson-section practical-section">
        <h3 class="section-icon-title"><span class="section-icon">🌍</span> For Our Lives Today</h3>
        <div class="teaching-text">
          ${formatTeachingText(lesson.practicalApplication)}
        </div>
      </section>

      <!-- Discussion Questions -->
      ${lesson.discussionQuestions && lesson.discussionQuestions.length > 0 ? `
        <section class="lesson-section questions-section">
          <h3 class="section-icon-title"><span class="section-icon">🤔</span> Questions to Explore</h3>
          <ul class="discussion-questions">
            ${lesson.discussionQuestions.map(q => `<li>${q}</li>`).join('')}
          </ul>
        </section>
      ` : ''}

      <!-- Source Attribution -->
      <section class="lesson-sources">
        <h4>This teaching synthesizes wisdom from:</h4>
        <div class="sources-grid">
          ${lesson.sources.classical.length > 0 ? `
            <div class="source-category">
              <strong>Classical Commentators:</strong>
              ${lesson.sources.classical.map(s => `<a href="https://www.sefaria.org/${s.link}" target="_blank">${s.name}</a>`).join(', ')}
            </div>
          ` : ''}
          ${lesson.sources.talmudic.length > 0 ? `
            <div class="source-category">
              <strong>Talmud:</strong>
              ${lesson.sources.talmudic.map(s => `<a href="https://www.sefaria.org/${s.link}" target="_blank">${s.name}</a>`).join(', ')}
            </div>
          ` : ''}
          ${lesson.sources.midrashic.length > 0 ? `
            <div class="source-category">
              <strong>Midrash:</strong>
              ${lesson.sources.midrashic.map(s => `<a href="https://www.sefaria.org/${s.link}" target="_blank">${s.name}</a>`).join(', ')}
            </div>
          ` : ''}
          ${lesson.sources.mystical.length > 0 ? `
            <div class="source-category">
              <strong>Mystical Tradition:</strong>
              ${lesson.sources.mystical.map(s => `<a href="https://www.sefaria.org/${s.link}" target="_blank">${s.name}</a>`).join(', ')}
            </div>
          ` : ''}
        </div>
      </section>
    </div>
  `;

  container.innerHTML = DOMPurify.sanitize(html);
}

/**
 * Format teaching text with paragraphs
 */
function formatTeachingText(text) {
  if (!text) return '';

  return text
    .split('\n\n')
    .map(para => `<p>${para.trim()}</p>`)
    .join('');
}

/**
 * Create lesson container if doesn't exist
 */
function createLessonContainer() {
  const container = document.createElement('div');
  container.id = 'unifiedLessonContainer';
  container.className = 'unified-lesson-container';

  const target = document.getElementById('overviewContent') || document.querySelector('.learning-section');
  if (target) {
    target.appendChild(container);
  }

  return container;
}

/**
 * Show lesson error
 */
function showLessonError(container, reference) {
  container.innerHTML = DOMPurify.sanitize(`
    <div class="lesson-error">
      <div class="error-icon">⚠️</div>
      <h3>Unable to load complete teaching</h3>
      <p>Could not fetch all sources for ${reference}. Please try again.</p>
      <button class="btn-primary" onclick="buildUnifiedLesson('${reference}')">Retry</button>
    </div>
  `);
}

/**
 * Fetch helpers (use existing API functions)
 */
async function fetchTorahText(reference) {
  try {
    const data = await fetchWithTimeout(`https://www.sefaria.org/api/texts/${reference}`, {}, 10000);
    const json = await data.json();
    return {
      hebrew: Array.isArray(json.he) ? json.he.join(' ') : json.he,
      english: Array.isArray(json.text) ? json.text.join(' ') : json.text,
      ref: json.ref
    };
  } catch (error) {
    console.error('Error fetching Torah text:', error);
    return { hebrew: '', english: '', ref: reference };
  }
}

async function fetchConnections(reference) {
  // Placeholder - would fetch thematic connections
  return [];
}

// Export
window.buildUnifiedLesson = buildUnifiedLesson;
