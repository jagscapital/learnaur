/**
 * ═══════════════════════════════════════════════════════════
 * PARSHA PAGE FUNCTIONALITY
 * Handles Torah portion display, modes, and intelligence
 * ═══════════════════════════════════════════════════════════
 */

let currentMode = 'casual';
let currentParsha = null;
let parshaData = null;

// ─────────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Hebrew date
  await initializeHebrewDateAPI();

  // Get mode from URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode') || 'casual';

  // Load current parsha
  await loadParshaPage();

  // Switch to requested mode
  switchMode(mode);
});

// ─────────────────────────────────────────────
// LOAD PARSHA PAGE
// ─────────────────────────────────────────────
async function loadParshaPage() {
  // Show loading state
  showLoadingState();

  try {
    // Fetch current parsha information
    currentParsha = await fetchCurrentParsha();

    if (!currentParsha) {
      throw new Error('Could not load parsha information');
    }

    // Update header
    updateParshaHeader(currentParsha);

    // Load Torah text from Sefaria with retry
    parshaData = await fetchParshaTextWithRetry(currentParsha.name);

    if (!parshaData || !parshaData.hebrew || parshaData.hebrew.length === 0) {
      throw new Error('Torah text could not be loaded from Sefaria');
    }

    // Initialize all modes
    await initializeCasualMode();
    await initializeDeepMode();
    await initializeStoryMode();

    // Hide loading state
    hideLoadingState();

  } catch (error) {
    console.error('Error loading parsha:', error);
    hideLoadingState();
    showError(
      'Unable to load Torah portion.',
      'This may be due to API rate limits or network issues.',
      () => location.reload()
    );
  }
}

/**
 * Fetch parsha text with automatic retry
 */
async function fetchParshaTextWithRetry(parshaName, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const data = await fetchParshaText(parshaName);
      if (data && data.hebrew && data.hebrew.length > 0) {
        return data;
      }
    } catch (error) {
      console.warn(`Attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
  throw new Error('Failed to fetch parsha after retries');
}

/**
 * Show loading state
 */
function showLoadingState() {
  const loadingHTML = `
    <div id="globalLoading" class="global-loading">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p class="loading-text">Loading Torah portion...</p>
        <p class="loading-subtext">Fetching from Sefaria.org</p>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', loadingHTML);
}

/**
 * Hide loading state
 */
function hideLoadingState() {
  const loading = document.getElementById('globalLoading');
  if (loading) {
    loading.style.opacity = '0';
    setTimeout(() => loading.remove(), 300);
  }
}

// ─────────────────────────────────────────────
// UPDATE PARSHA HEADER
// ─────────────────────────────────────────────
function updateParshaHeader(parsha) {
  // Update parsha names
  const englishName = document.getElementById('parshaNameEnglish');
  const hebrewName = document.getElementById('parshaNameHebrew');
  const reference = document.getElementById('parshaReference');
  const bookBadge = document.getElementById('bookBadge');

  if (englishName) englishName.textContent = parsha.name;
  if (hebrewName) hebrewName.textContent = parsha.hebrew || parsha.name;
  if (reference) reference.textContent = `Weekly Torah Portion • ${new Date().getFullYear()}`;

  // Determine book name
  const book = determineBook(parsha.name);
  if (bookBadge) bookBadge.textContent = book.toUpperCase();
}

function determineBook(parshaName) {
  const books = {
    bereshit: ['Bereshit', 'Noach', 'Lech-Lecha', 'Vayera', 'Chayei Sara', 'Toldot', 'Vayetzei', 'Vayishlach', 'Vayeshev', 'Miketz', 'Vayigash', 'Vayechi'],
    exodus: ['Shemot', 'Vaera', 'Bo', 'Beshalach', 'Yitro', 'Mishpatim', 'Terumah', 'Tetzaveh', 'Ki Tisa', 'Vayakhel', 'Pekudei'],
    leviticus: ['Vayikra', 'Tzav', 'Shmini', 'Tazria', 'Metzora', 'Achrei Mot', 'Kedoshim', 'Emor', 'Behar', 'Bechukotai'],
    numbers: ['Bamidbar', 'Nasso', 'Beha\'alotcha', 'Sh\'lach', 'Korach', 'Chukat', 'Balak', 'Pinchas', 'Matot', 'Masei'],
    deuteronomy: ['Devarim', 'Vaetchanan', 'Eikev', 'Re\'eh', 'Shoftim', 'Ki Teitzei', 'Ki Tavo', 'Nitzavim', 'Vayeilech', 'Ha\'Azinu', 'V\'Zot HaBerachah']
  };

  for (const [book, parshiyot] of Object.entries(books)) {
    if (parshiyot.includes(parshaName)) {
      return book === 'bereshit' ? 'Genesis' :
             book === 'exodus' ? 'Exodus' :
             book === 'leviticus' ? 'Leviticus' :
             book === 'numbers' ? 'Numbers' : 'Deuteronomy';
    }
  }

  return 'Torah';
}

// ─────────────────────────────────────────────
// MODE SWITCHING
// ─────────────────────────────────────────────
function switchMode(mode) {
  currentMode = mode;

  // Update mode tabs
  document.querySelectorAll('.mode-tab').forEach(tab => {
    tab.classList.remove('active');
    if (tab.dataset.mode === mode) {
      tab.classList.add('active');
    }
  });

  // Show corresponding section
  document.querySelectorAll('.learning-section').forEach(section => {
    section.classList.remove('active');
  });

  const targetSection = document.getElementById(`${mode}Mode`);
  if (targetSection) {
    targetSection.classList.add('active');
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─────────────────────────────────────────────
// CASUAL MODE
// ─────────────────────────────────────────────
async function initializeCasualMode() {
  const summaryEl = document.getElementById('summaryText');
  const takeawayEl = document.getElementById('takeawayText');
  const wisdomEl = document.getElementById('wisdomText');

  if (!parshaData) return;

  // Generate casual content
  const casualContent = generateCasualContent(currentParsha, parshaData);

  if (summaryEl) {
    summaryEl.innerHTML = DOMPurify.sanitize(`<p>${casualContent.summary}</p>`);
  }

  if (takeawayEl) {
    takeawayEl.innerHTML = DOMPurify.sanitize(`<p>${casualContent.takeaway}</p>`);
  }

  if (wisdomEl) {
    wisdomEl.innerHTML = DOMPurify.sanitize(`<p>${casualContent.wisdom}</p>`);
  }
}

function generateCasualContent(parsha, data) {
  // This would ideally use AI to generate summaries
  // For now, we'll provide structure

  return {
    summary: `This week we read Parshat ${parsha.name}, which contains profound teachings about faith, morality, and our relationship with the Divine. The portion explores key themes that resonate throughout Jewish thought and practice.`,

    takeaway: `The central lesson of this parsha teaches us about the importance of trust, commitment, and spiritual growth. These timeless principles guide us in building meaningful relationships with each other and with God.`,

    wisdom: `In our daily lives, we can apply these Torah teachings by practicing compassion, maintaining integrity, and seeking wisdom in our choices. The parsha reminds us that every action matters and that we have the power to sanctify the ordinary.`
  };
}

// ─────────────────────────────────────────────
// DEEP DIVE MODE
// ─────────────────────────────────────────────
async function initializeDeepMode() {
  if (!parshaData) return;

  // Generate aliyah navigation
  generateAliyahNav();

  // Display parallel texts
  displayParallelText(parshaData);

  // Load commentaries
  await loadCommentaries();
}

function generateAliyahNav() {
  const aliyahNav = document.getElementById('aliyahNav');
  if (!aliyahNav) return;

  // Use actual aliyot from parshaData if available
  let aliyot;
  if (parshaData && parshaData.aliyot && parshaData.aliyot.length > 0) {
    aliyot = parshaData.aliyot;
  } else {
    // Fallback to standard 7 aliyot
    aliyot = [
      { name: 'Rishon' },
      { name: 'Sheni' },
      { name: 'Shlishi' },
      { name: 'Revi\'i' },
      { name: 'Chamishi' },
      { name: 'Shishi' },
      { name: 'Shvi\'i' }
    ];
  }

  aliyahNav.innerHTML = DOMPurify.sanitize(aliyot.map((aliyah, index) => `
    <button class="aliyah-button ${index === 0 ? 'active' : ''}" onclick="scrollToAliyah(${aliyah.start || index + 1})">
      ${aliyah.name}
      ${aliyah.start && aliyah.end ? `<span class="aliyah-range">(${aliyah.start}-${aliyah.end})</span>` : ''}
    </button>
  `).join(''));
}

function displayParallelText(data) {
  const hebrewEl = document.getElementById('hebrewText');
  const englishEl = document.getElementById('englishText');

  if (!hebrewEl || !englishEl) return;

  // Validate data
  if (!data || !data.hebrew || !Array.isArray(data.hebrew) || data.hebrew.length === 0) {
    hebrewEl.innerHTML = DOMPurify.sanitize(`
      <div class="error-message">
        <p>Unable to load Hebrew text.</p>
        <button onclick="location.reload()" class="retry-button">Retry</button>
      </div>
    `);
    englishEl.innerHTML = DOMPurify.sanitize(`
      <div class="error-message">
        <p>Unable to load English translation.</p>
      </div>
    `);
    return;
  }

  // Display Hebrew text
  hebrewEl.innerHTML = DOMPurify.sanitize(data.hebrew.map((verse, index) => {
    const aliyah = data.aliyot ? data.aliyot.find(a => index + 1 === a.start) : null;
    const aliyahMarker = aliyah ? `<div class="aliyah-marker" id="aliyah-${index + 1}">${aliyah.name}</div>` : '';

    return `
      ${aliyahMarker}
      <div class="verse" id="verse-${index + 1}" data-verse="${index + 1}">
        <span class="verse-number">${index + 1}</span>
        <span class="verse-text">${verse}</span>
      </div>
    `;
  }).join(''));

  // Display English text
  if (Array.isArray(data.english) && data.english.length > 0) {
    englishEl.innerHTML = DOMPurify.sanitize(data.english.map((verse, index) => {
      const aliyah = data.aliyot ? data.aliyot.find(a => index + 1 === a.start) : null;
      const aliyahMarker = aliyah ? `<div class="aliyah-marker">${aliyah.name}</div>` : '';

      return `
        ${aliyahMarker}
        <div class="verse" id="verse-en-${index + 1}" data-verse="${index + 1}">
          <span class="verse-number">${index + 1}</span>
          <span class="verse-text">${verse}</span>
        </div>
      `;
    }).join(''));
  } else {
    // Fallback: show verse numbers only
    englishEl.innerHTML = DOMPurify.sanitize(data.hebrew.map((_, index) => `
      <div class="verse verse-placeholder" id="verse-en-${index + 1}">
        <span class="verse-number">${index + 1}</span>
        <span class="verse-text">Translation loading...</span>
      </div>
    `).join(''));
  }

  // Sync scrolling between Hebrew and English
  syncParallelScrolling(hebrewEl, englishEl);

  // Enable verse highlighting on hover
  enableVerseHighlighting();
}

function syncParallelScrolling(hebrew, english) {
  let isScrolling = false;

  hebrew.addEventListener('scroll', () => {
    if (!isScrolling) {
      isScrolling = true;
      english.scrollTop = hebrew.scrollTop;
      setTimeout(() => { isScrolling = false; }, 100);
    }
  });

  english.addEventListener('scroll', () => {
    if (!isScrolling) {
      isScrolling = true;
      hebrew.scrollTop = english.scrollTop;
      setTimeout(() => { isScrolling = false; }, 100);
    }
  });
}

function scrollToAliyah(aliyahNumber) {
  // Update active button
  document.querySelectorAll('.aliyah-button').forEach(btn => {
    btn.classList.remove('active');
  });

  event?.target?.classList.add('active');

  // Find aliyah marker
  const marker = document.getElementById(`aliyah-${aliyahNumber}`);

  if (marker) {
    marker.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Highlight briefly
    marker.style.animation = 'none';
    setTimeout(() => {
      marker.style.animation = 'highlightPulse 2s ease';
    }, 10);
  } else {
    // Fallback: estimate position
    const hebrewText = document.getElementById('hebrewText');
    if (hebrewText && parshaData && parshaData.aliyot) {
      const aliyah = parshaData.aliyot.find(a => a.name.includes(aliyahNumber) || parshaData.aliyot.indexOf(a) === aliyahNumber - 1);
      if (aliyah) {
        const verse = document.querySelector(`[data-verse="${aliyah.start}"]`);
        if (verse) {
          verse.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  }
}

/**
 * Enable verse highlighting on hover
 */
function enableVerseHighlighting() {
  const verses = document.querySelectorAll('.verse');

  verses.forEach(verse => {
    verse.addEventListener('mouseenter', function() {
      const verseNum = this.dataset.verse;
      if (verseNum) {
        const correspondingVerse = document.querySelector(
          this.id.includes('-en-') ?
            `#verse-${verseNum}` :
            `#verse-en-${verseNum}`
        );

        this.classList.add('highlighted');
        correspondingVerse?.classList.add('highlighted');
      }
    });

    verse.addEventListener('mouseleave', function() {
      document.querySelectorAll('.verse.highlighted').forEach(v => {
        v.classList.remove('highlighted');
      });
    });
  });
}

// ─────────────────────────────────────────────
// COMMENTARIES
// ─────────────────────────────────────────────
async function loadCommentaries() {
  // Load overview
  loadOverviewContent();

  // Load Gemara references (would fetch from Sefaria)
  loadGemaraContent();

  // Load Midrash
  loadMidrashContent();

  // Load Chassidus
  loadChassidusContent();

  // Load Kabbalah
  loadKabbalahContent();

  // Load connections
  loadConnectionsContent();
}

async function loadOverviewContent() {
  const overview = document.getElementById('overviewContent');
  if (!overview) return;

  overview.innerHTML = DOMPurify.sanitize('<div class="loading">Loading commentaries...</div>');

  try {
    // Get first verse reference from current parsha
    const reference = parshaData ? `${parshaData.ref}`.split('-')[0] : null;

    if (!reference) {
      throw new Error('No reference available');
    }

    // Fetch commentaries from Sefaria
    const commentaries = await fetchCommentaries(reference);

    if (!commentaries || commentaries.length === 0) {
      overview.innerHTML = DOMPurify.sanitize(`
        <div class="commentary-item">
          <div class="commentary-text">
            This parsha contains profound insights from Rashi, Ramban, Ibn Ezra, and other classical commentators.
            Full commentary integration coming soon.
          </div>
        </div>
      `);
      return;
    }

    // Display commentaries
    overview.innerHTML = DOMPurify.sanitize(commentaries.slice(0, 5).map(comm => `
      <div class="commentary-item">
        <div class="commentary-source">${comm.source}</div>
        <div class="commentary-text">
          ${comm.english || comm.hebrew || 'Commentary text available on Sefaria.org'}
        </div>
        ${comm.reference ? `<a href="https://www.sefaria.org/${comm.reference}" target="_blank" class="reference-link">Read more on Sefaria →</a>` : ''}
      </div>
    `).join(''));

  } catch (error) {
    console.error('Error loading overview:', error);
    overview.innerHTML = DOMPurify.sanitize(`
      <div class="commentary-item">
        <div class="commentary-source">Commentary Overview</div>
        <div class="commentary-text">
          This Torah portion is enriched by classical commentaries including Rashi, Ramban, and Ibn Ezra.
          These sages provide insights into the text's meaning, legal implications, and spiritual dimensions.
        </div>
      </div>
    `);
  }
}

async function loadGemaraContent() {
  const gemara = document.getElementById('gemaraContent');
  if (!gemara) return;

  gemara.innerHTML = DOMPurify.sanitize('<div class="loading">Loading Gemara references...</div>');

  try {
    const reference = parshaData ? `${parshaData.ref}`.split('-')[0] : null;
    if (!reference) throw new Error('No reference');

    const crossRefs = await fetchCrossReferences(reference);

    if (crossRefs.gemara && crossRefs.gemara.length > 0) {
      gemara.innerHTML = DOMPurify.sanitize(crossRefs.gemara.slice(0, 5).map(ref => `
        <div class="commentary-item">
          <div class="commentary-source">${ref.source}</div>
          <div class="commentary-text">
            ${ref.english || ref.hebrew || 'See full reference on Sefaria'}
          </div>
          <a href="https://www.sefaria.org/${ref.reference}" target="_blank" class="reference-link">
            ${ref.reference} →
          </a>
        </div>
      `).join(''));
    } else {
      gemara.innerHTML = DOMPurify.sanitize(`
        <div class="commentary-item">
          <div class="commentary-source">Talmud Connections</div>
          <div class="commentary-text">
            The Talmud explores this Torah passage through legal discussions, ethical teachings, and profound insights.
            Gemara references are being compiled and will be available soon.
          </div>
        </div>
      `);
    }
  } catch (error) {
    console.error('Error loading Gemara:', error);
    gemara.innerHTML = DOMPurify.sanitize(`
      <div class="commentary-item">
        <div class="commentary-text">
          Gemara references for this portion explore its legal and ethical dimensions through Talmudic discussion.
        </div>
      </div>
    `);
  }
}

async function loadMidrashContent() {
  const midrash = document.getElementById('midrashContent');
  if (!midrash) return;

  midrash.innerHTML = DOMPurify.sanitize('<div class="loading">Loading Midrash...</div>');

  try {
    const reference = parshaData ? `${parshaData.ref}`.split('-')[0] : null;
    if (!reference) throw new Error('No reference');

    const crossRefs = await fetchCrossReferences(reference);

    if (crossRefs.midrash && crossRefs.midrash.length > 0) {
      midrash.innerHTML = DOMPurify.sanitize(crossRefs.midrash.slice(0, 5).map(ref => `
        <div class="commentary-item">
          <div class="commentary-source">${ref.source}</div>
          <div class="commentary-text">
            ${ref.english || ref.hebrew || 'Midrashic teaching available on Sefaria'}
          </div>
          <a href="https://www.sefaria.org/${ref.reference}" target="_blank" class="reference-link">
            ${ref.reference} →
          </a>
        </div>
      `).join(''));
    } else {
      midrash.innerHTML = DOMPurify.sanitize(`
        <div class="commentary-item">
          <div class="commentary-source">Midrash Rabbah</div>
          <div class="commentary-text">
            Midrashic interpretations reveal deeper layers through stories, allegories, and homiletic teachings.
            These ancient teachings illuminate hidden wisdom in the Torah text.
          </div>
        </div>
      `);
    }
  } catch (error) {
    console.error('Error loading Midrash:', error);
    midrash.innerHTML = DOMPurify.sanitize(`
      <div class="commentary-item">
        <div class="commentary-text">
          Midrashic teachings for this portion explore its deeper meanings through narrative and allegory.
        </div>
      </div>
    `);
  }
}

function loadChassidusContent() {
  const chassidus = document.getElementById('chassidusContent');
  if (!chassidus) return;

  chassidus.innerHTML = DOMPurify.sanitize(`
    <div class="commentary-item">
      <div class="commentary-source">Chassidic Masters</div>
      <div class="commentary-text">
        Chassidic teachings explore the soul-dimension of Torah, revealing how the parsha speaks to our inner spiritual journey and connection with the Divine.
      </div>
      <a href="#" class="reference-link">Deepen your understanding →</a>
    </div>

    <div class="commentary-item">
      <div class="commentary-source">Lubavitcher Rebbe</div>
      <div class="commentary-text">
        The Rebbe's insights connect the Torah's timeless wisdom to contemporary life, showing us how to live with purpose and meaning.
      </div>
    </div>
  `);
}

function loadKabbalahContent() {
  const kabbalah = document.getElementById('kabbalahContent');
  if (!kabbalah) return;

  kabbalah.innerHTML = DOMPurify.sanitize(`
    <div class="commentary-item">
      <div class="commentary-source">Zohar</div>
      <div class="commentary-text">
        The Zohar reveals the mystical dimensions of the Torah, unveiling the divine secrets encoded within every word and letter.
      </div>
      <a href="#" class="reference-link">Study Kabbalah →</a>
    </div>
  `);
}

async function loadConnectionsContent() {
  const connections = document.getElementById('connectionsContent');
  if (!connections) return;

  connections.innerHTML = DOMPurify.sanitize('<div class="loading">Loading connections...</div>');

  try {
    const reference = parshaData ? `${parshaData.ref}`.split('-')[0] : null;
    if (!reference) throw new Error('No reference');

    const crossRefs = await fetchCrossReferences(reference);
    const allRefs = [...(crossRefs.other || [])];

    if (allRefs.length > 0) {
      connections.innerHTML = DOMPurify.sanitize(allRefs.slice(0, 8).map(ref => `
        <div class="commentary-item">
          <div class="commentary-source">${ref.source}</div>
          <div class="commentary-text">
            ${ref.english || ref.hebrew || 'Cross-reference available on Sefaria'}
          </div>
          <a href="https://www.sefaria.org/${ref.reference}" target="_blank" class="reference-link">
            ${ref.reference} →
          </a>
        </div>
      `).join(''));
    } else {
      connections.innerHTML = DOMPurify.sanitize(`
        <div class="commentary-item">
          <div class="commentary-source">Torah Connections</div>
          <div class="commentary-text">
            This parsha connects to numerous passages throughout Torah, Prophets, and Writings.
            The web of connections creates a rich tapestry revealing the unity of all Jewish texts.
          </div>
        </div>
      `);
    }
  } catch (error) {
    console.error('Error loading connections:', error);
    connections.innerHTML = DOMPurify.sanitize(`
      <div class="commentary-item">
        <div class="commentary-text">
          Torah connections for this portion span across Tanach, revealing thematic and textual relationships.
        </div>
      </div>
    `);
  }
}

// ─────────────────────────────────────────────
// COMMENTARY TABS
// ─────────────────────────────────────────────
function showCommentaryTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.comm-tab').forEach(tab => {
    tab.classList.remove('active');
  });

  event.target.classList.add('active');

  // Show corresponding content
  document.querySelectorAll('.commentary-tab-content').forEach(content => {
    content.classList.remove('active');
  });

  const targetContent = document.getElementById(`${tabName}Tab`);
  if (targetContent) {
    targetContent.classList.add('active');
  }
}

// ─────────────────────────────────────────────
// STORY MODE
// ─────────────────────────────────────────────
async function initializeStoryMode() {
  const storyEl = document.getElementById('storyText');
  if (!storyEl) return;

  const storyContent = generateStoryContent(currentParsha, parshaData);

  storyEl.innerHTML = DOMPurify.sanitize(storyContent);
}

function generateStoryContent(parsha, data) {
  if (!data || !data.hebrew || !parsha) {
    return `<p>Story content for this parsha is being prepared...</p>`;
  }

  const parshaName = parsha.name || 'this Torah portion';
  const firstVerse = data.english && Array.isArray(data.english) && data.english.length > 0
    ? data.english[0]
    : '';

  // Build actual narrative from the Torah text
  let narrative = `<div class="story-section">`;

  // Opening based on actual parsha
  if (parshaName.toLowerCase().includes('bereshit') || parshaName.toLowerCase().includes('genesis')) {
    narrative += `<p><strong>In the beginning...</strong> The Torah opens with the most majestic words ever written: "${firstVerse}" These six words contain infinite wisdom about creation, time, and purpose.</p>`;
    narrative += `<p>God creates not through force or struggle, but through speech—"Let there be light." This teaches us the power of words, of intention, of bringing order from chaos. Each day of creation reveals another dimension of the Divine plan.</p>`;
  } else if (parshaName.toLowerCase().includes('noach')) {
    narrative += `<p><strong>A righteous man in a corrupt generation...</strong> Noah stands alone in moral clarity when the entire world has descended into violence. "${firstVerse}"</p>`;
    narrative += `<p>The flood is not merely punishment—it's purification, a reset button for humanity. Noah's ark becomes a microcosm of preservation, where each creature matters, where diversity is sacred, where hope floats above destruction.</p>`;
  } else if (parshaName.toLowerCase().includes('lech')) {
    narrative += `<p><strong>"Go forth from your land..."</strong> God calls Abraham to leave everything familiar. "${firstVerse}" This is the story of every spiritual journey—the courage to depart, the faith to journey toward an unknown destination.</p>`;
    narrative += `<p>Abraham doesn't just travel geographically; he journeys inward. Each step toward Canaan is a step toward his authentic self. His story teaches us that growth requires departure, that becoming who we're meant to be means leaving who we were.</p>`;
  } else {
    // Generic but better narrative using actual Torah content
    narrative += `<p>Parshat ${parshaName} opens: "${firstVerse || 'Torah text loading...'}"</p>`;
    narrative += `<p>This portion reveals deep truths through its narratives, laws, and teachings. The Torah here addresses fundamental questions about identity, purpose, and our relationship with the Divine.</p>`;
  }

  // Add character insights if we have them
  narrative += `</div><div class="story-section">`;

  if (data.english && Array.isArray(data.english) && data.english.length > 5) {
    narrative += `<p><strong>The characters come alive:</strong> Every personality in Torah represents aspects of the human experience. Their struggles mirror our own—doubt and faith, anger and forgiveness, ambition and humility.</p>`;
    narrative += `<p>As we read their stories, we're not studying ancient history; we're discovering ourselves. The Torah's characters are archetypes, templates for understanding human nature in all its complexity.</p>`;
  }

  // Connection to eternal themes
  narrative += `<p><strong>Eternal wisdom for today:</strong> This parsha's teachings transcend time. The questions it raises—about justice, compassion, faith, community—are the same ones we grapple with today.</p>`;
  narrative += `<p>Through these sacred narratives, we connect with over 3,000 years of Jewish wisdom, joining an eternal conversation between heaven and earth, past and future.</p>`;
  narrative += `</div>`;

  return narrative;
}

// ─────────────────────────────────────────────
// ERROR HANDLING
// ─────────────────────────────────────────────
function showError(title, message, retryCallback) {
  console.error(title, message);

  const errorDiv = document.createElement('div');
  errorDiv.id = 'globalError';
  errorDiv.className = 'global-error';
  errorDiv.innerHTML = DOMPurify.sanitize(`
    <div class="error-content glass">
      <div class="error-icon">⚠️</div>
      <h3 class="error-title">${title}</h3>
      <p class="error-message">${message}</p>
      <div class="error-actions">
        <button class="error-button primary" onclick="(${retryCallback.toString()})()">
          Try Again
        </button>
        <button class="error-button" onclick="window.location.href='index.html'">
          Go Home
        </button>
      </div>
    </div>
  `);

  document.body.appendChild(errorDiv);

  // Fade in
  setTimeout(() => {
    errorDiv.style.opacity = '1';
  }, 10);
}

// ─────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────
window.switchMode = switchMode;
window.showCommentaryTab = showCommentaryTab;
window.scrollToAliyah = scrollToAliyah;
