/**
 * ═══════════════════════════════════════════════════════════
 * COMMENTARY TEACHING DISPLAY SYSTEM
 * Transforms raw commentary links into rich educational experiences
 * ═══════════════════════════════════════════════════════════
 */

// Load commentator metadata
let commentatorData = {};

async function loadCommentatorData() {
  try {
    const response = await fetchWithTimeout('/data/commentators.json', {}, 5000);
    const data = await response.json();
    commentatorData = data.commentators;
  } catch (error) {
    console.error('Error loading commentator data:', error);
  }
}

/**
 * Create a beautiful teaching card for a commentary
 */
function createCommentaryCard(commentary) {
  const commentator = commentatorData[commentary.id] || {};

  return `
    <div class="commentary-card" style="--commentator-color: ${commentator.color || '#4A90E2'}">
      <!-- Commentator Header -->
      <div class="commentator-header">
        <div class="commentator-icon">${commentator.icon || '📖'}</div>
        <div class="commentator-info">
          <h3>
            ${commentator.name || commentary.name}
            <span class="commentator-hebrew">${commentator.hebrewName || ''}</span>
          </h3>
          <div class="commentator-meta">
            <span class="commentator-era">📅 ${commentator.era || 'Classical Era'}</span>
            <span class="commentator-location">📍 ${commentator.location || 'Traditional'}</span>
          </div>
        </div>
      </div>

      <!-- Who This Commentator Is -->
      <div class="commentator-bio">
        <strong>${commentator.fullName || commentator.name}</strong><br>
        ${commentator.bio || 'A respected Torah commentator whose insights illuminate the text.'}
        <span class="approach-badge">${commentator.approach || 'Traditional Commentary'}</span>
      </div>

      <!-- The Commentary Text -->
      <div class="commentary-text-section">
        <div class="commentary-label">💬 Commentary on ${commentary.reference}</div>

        ${commentary.hebrew ? `
          <div class="commentary-hebrew">${commentary.hebrew}</div>
        ` : ''}

        <div class="commentary-english">
          ${commentary.english || commentary.text || 'Commentary text available on Sefaria.org'}
        </div>
      </div>

      <!-- Why This Matters -->
      ${commentary.whyMatters ? `
        <div class="why-matters">
          <h4>💡 Why This Matters</h4>
          <p>${commentary.whyMatters}</p>
        </div>
      ` : ''}

      <!-- Modern Application -->
      ${commentary.modernApplication ? `
        <div class="modern-application">
          <h4>🌍 For Us Today</h4>
          <p>${commentary.modernApplication}</p>
        </div>
      ` : ''}

      <!-- Discussion Questions -->
      ${commentary.questions && commentary.questions.length > 0 ? `
        <div class="discussion-questions">
          <h4>🤔 Think About This</h4>
          <ul>
            ${commentary.questions.map(q => `<li>${q}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      <!-- Connections to Other Commentators -->
      ${commentary.connections && commentary.connections.length > 0 ? `
        <div class="commentary-connections">
          <h4>🔗 In Dialogue With...</h4>
          ${commentary.connections.map(conn => `
            <div class="connection-item">
              <div class="connection-commentator">${conn.commentator}</div>
              <div class="connection-text">${conn.text}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- Reference Link -->
      <div class="commentary-reference">
        📚 <a href="${commentary.sefariaLink || '#'}" target="_blank" rel="noopener">
          Read full commentary on Sefaria.org
        </a>
      </div>
    </div>
  `;
}

/**
 * Display commentary teaching cards
 */
function displayCommentaries(commentaries, containerId) {
  const container = document.getElementById(containerId);

  if (!container) {
    console.error(`Container ${containerId} not found`);
    return;
  }

  if (!commentaries || commentaries.length === 0) {
    container.innerHTML = DOMPurify.sanitize(`
      <div class="commentary-empty">
        <h3>📚 Commentaries Coming Soon</h3>
        <p>We're preparing beautiful educational commentaries for this parsha.</p>
      </div>
    `);
    return;
  }

  const html = `
    <div class="commentary-teaching-section">
      <div class="container">
        <h2 class="content-title">Torah Commentary as Teaching</h2>
        <p style="text-align: center; color: #666; margin-bottom: 2rem;">
          Learn from the masters - not just what they said, but why it matters
        </p>
        <div class="commentary-grid">
          ${commentaries.map(c => createCommentaryCard(c)).join('')}
        </div>
      </div>
    </div>
  `;

  container.innerHTML = DOMPurify.sanitize(html);
}

/**
 * Sample commentary data for Bereshit (will be replaced with real data)
 */
const sampleCommentaries = {
  bereshit: [
    {
      id: 'rashi',
      name: 'Rashi',
      reference: 'Genesis 1:1',
      hebrew: 'בראשית ברא - אין המקרא הזה אומר אלא דרשני',
      english: '"In the beginning God created" - This verse cries out for interpretation! Why doesn\'t the Torah begin with the first commandment given to Israel? Because God wanted to show that the entire earth belongs to Him, and He can give it to whomever He chooses.',
      whyMatters: 'Rashi addresses the fundamental question: Why does the Torah start with Creation instead of the first mitzvah? His answer establishes that God\'s ownership of the world legitimizes Israel\'s possession of the Land of Israel.',
      modernApplication: 'When we face challenges to our beliefs or rights, we need foundational principles. Understanding the "why" behind our traditions gives us confidence and clarity in defending our values.',
      questions: [
        'What does it mean that God "owns" the world? How does that affect how we treat the environment?',
        'Why is it important to start with first principles when teaching something important?',
        'How does understanding Creation help us understand our purpose?'
      ],
      connections: [
        {
          commentator: 'Ramban disagrees',
          text: 'Ramban argues that the Torah SHOULD begin here because Creation establishes God\'s absolute power, which is the foundation for all commandments.'
        }
      ],
      sefariaLink: 'https://www.sefaria.org/Rashi_on_Genesis.1.1'
    },
    {
      id: 'ramban',
      name: 'Ramban',
      reference: 'Genesis 1:1',
      english: 'The Torah begins with Creation to teach us that God created everything ex nihilo - from absolute nothingness. This is a fundamental principle of faith that distinguishes Jewish belief from Greek philosophy, which claimed matter was eternal.',
      whyMatters: 'Ramban is teaching us a theological principle: God is not limited by anything. If matter always existed, God would be working with pre-existing materials. But creation from nothing shows God\'s unlimited power and sovereignty.',
      modernApplication: 'When we face impossible situations, remembering that God created everything from nothing reminds us that nothing is truly impossible. Our challenges are never too big for the One who made something from nothing.',
      questions: [
        'What\'s the difference between making something from existing materials vs. creating from nothing?',
        'How does belief in creation from nothing affect how we see miracles?',
        'Why did Greek philosophy struggle with this concept?'
      ],
      connections: [
        {
          commentator: 'Builds on Rashi',
          text: 'While Rashi focuses on why Torah starts here, Ramban explains what "beginning" actually means philosophically.'
        }
      ],
      sefariaLink: 'https://www.sefaria.org/Ramban_on_Genesis.1.1'
    },
    {
      id: 'sforno',
      name: 'Sforno',
      reference: 'Genesis 1:1',
      english: '"In the beginning" - God created the world with a purpose: so that humanity could choose good freely. The entire Creation exists to give humans the opportunity for moral choice and spiritual growth.',
      whyMatters: 'Sforno shifts focus from God\'s power to God\'s purpose. Why did God create? To create beings capable of free will who could choose goodness. This makes humans partners in Creation through their moral choices.',
      modernApplication: 'Your choices matter immensely. The entire universe was created so you could make meaningful moral decisions. Every act of kindness, every ethical choice, fulfills the very purpose of Creation itself.',
      questions: [
        'If God wanted goodness, why allow evil to exist at all?',
        'What makes human choice so valuable that the whole world was created for it?',
        'How does knowing Creation\'s purpose change how we make daily decisions?'
      ],
      connections: [],
      sefariaLink: 'https://www.sefaria.org/Sforno_on_Genesis.1.1'
    }
  ]
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  await loadCommentatorData();
});

// Export functions
window.createCommentaryCard = createCommentaryCard;
window.displayCommentaries = displayCommentaries;
window.sampleCommentaries = sampleCommentaries;
window.loadCommentatorData = loadCommentatorData;
