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
  ],

  noach: [
    {
      id: 'rashi',
      name: 'Rashi',
      reference: 'Genesis 6:9',
      hebrew: 'צדיק תמים - לפי דורותיו, יש מרבותינו דורשים אותו לשבח',
      english: '"Noah was a righteous man, perfect in his generations" - Some of our Sages interpret this as praise: compared to his wicked generation, he was righteous. In a generation of truly righteous people, he would not have been considered so special. Others say it\'s the opposite praise: if he was righteous even in a corrupt generation, imagine how righteous he would have been among good people!',
      whyMatters: 'Rashi presents two opposing views to teach us about judging people in context. Do we credit someone more for being good in a bad environment, or do we recognize they could have been even better in a different setting? Both perspectives are valid.',
      modernApplication: 'When evaluating ourselves or others, context matters immensely. Someone maintaining integrity in a corrupt workplace deserves recognition. At the same time, we shouldn\'t limit ourselves by our environment - we can always grow beyond it.',
      questions: [
        'Which interpretation do you find more compelling and why?',
        'Have you ever been the "righteous one" in a difficult environment? How did it feel?',
        'How does environment shape character? Can we transcend our circumstances?'
      ],
      connections: [
        {
          commentator: 'Ibn Ezra\'s perspective',
          text: 'Ibn Ezra sides with the first interpretation: Noah\'s righteousness was relative to his generation. This teaches us humility - our achievements must be measured against true excellence, not just comparison to others.'
        }
      ],
      sefariaLink: 'https://www.sefaria.org/Rashi_on_Genesis.6.9'
    },
    {
      id: 'ramban',
      name: 'Ramban',
      reference: 'Genesis 6:13',
      english: 'When God says "the end of all flesh has come before Me," Ramban explains this wasn\'t arbitrary destruction. The corruption had reached a point where the very fabric of creation was unraveling. The violence (chamas) had poisoned everything - humans, animals, even the earth itself.',
      whyMatters: 'Ramban teaches that moral corruption has cosmic consequences. When humans act with violence and injustice, it doesn\'t just hurt other people - it damages the entire created order. The flood was measure-for-measure: they flooded the world with violence, so water flooded the world.',
      modernApplication: 'Environmental destruction, social injustice, and moral corruption are interconnected. When we pollute relationships with dishonesty or society with injustice, we\'re damaging more than we realize. Our ethical choices have ripple effects throughout creation.',
      questions: [
        'Do you see evidence today that moral corruption affects the physical world?',
        'What does "violence" (chamas) mean beyond physical harm?',
        'How can one person\'s righteousness (like Noah) make a difference in a corrupt world?'
      ],
      connections: [
        {
          commentator: 'Modern environmental Torah',
          text: 'Contemporary Torah scholars connect this to environmental ethics: human moral failure leads to ecological crisis. Ramban\'s insight is incredibly relevant to climate change and sustainability.'
        }
      ],
      sefariaLink: 'https://www.sefaria.org/Ramban_on_Genesis.6.13'
    },
    {
      id: 'kli_yakar',
      name: 'Kli Yakar',
      reference: 'Genesis 7:1',
      english: 'God tells Noah "you alone I have found righteous before Me in this generation." Kli Yakar asks: why didn\'t God tell Noah earlier? He explains that God waited until the last moment so Noah wouldn\'t become arrogant. Pride comes before a fall - knowing you\'re the only righteous person in the world could ruin you spiritually.',
      whyMatters: 'The Kli Yakar teaches us that even genuine righteousness can be destroyed by awareness of it. Humility isn\'t just a nice trait - it\'s essential protection for our spiritual growth. God\'s timing in revelation teaches us about the dangers of premature recognition.',
      modernApplication: 'When you\'re doing well spiritually, ethically, or professionally, be careful about how much attention you give yourself. Recognition and praise, even when deserved, can undermine the very qualities that earned them. Stay grounded, stay humble.',
      questions: [
        'Have you ever seen someone\'s success go to their head? What happened?',
        'Why is humility so important for sustained goodness?',
        'How can we accept deserved recognition without becoming arrogant?'
      ],
      connections: [],
      sefariaLink: 'https://www.sefaria.org/Kli_Yakar_on_Genesis.7.1'
    }
  ],

  "lech-lecha": [
    {
      id: 'rashi',
      name: 'Rashi',
      reference: 'Genesis 12:1',
      hebrew: 'לך לך - לך להנאתך ולטובתך',
      english: '"Go forth (lech lecha) from your land" - The doubling of the word "lech" (go) teaches us: Go FOR YOURSELF, for your own benefit and good. God is not asking Abraham to sacrifice everything - He\'s inviting him to actualize his potential. The journey is ultimately for Abraham\'s own growth.',
      whyMatters: 'Rashi revolutionizes how we understand divine commands. When God asks us to change, leave comfort, or take risks - it\'s not divine sadism. It\'s an invitation to become who we\'re meant to be. The Hebrew "lech lecha" literally means "go to yourself" - journey to your authentic self.',
      modernApplication: 'When life demands you leave your comfort zone - a career change, moving cities, ending a relationship - reframe it. This isn\'t loss; it\'s invitation. You\'re not being taken FROM something, you\'re being invited TO yourself. Growth requires departure.',
      questions: [
        'What would "lech lecha" - going to yourself - mean for you right now?',
        'What comfort zone is God/life inviting you to leave?',
        'How have past departures (from places, relationships, old versions of yourself) led to growth?'
      ],
      connections: [
        {
          commentator: 'Sforno adds depth',
          text: 'Sforno notes that Abraham was 75 years old. It\'s never too late for transformation. The invitation to "go to yourself" comes at every age and stage of life.'
        }
      ],
      sefariaLink: 'https://www.sefaria.org/Rashi_on_Genesis.12.1'
    },
    {
      id: 'ramban',
      name: 'Ramban',
      reference: 'Genesis 15:6',
      english: 'When God promises Abraham descendants as numerous as the stars, Abraham believes, and God "reckoned it to him as righteousness." Ramban explains that Abraham\'s faith was extraordinary because he had no evidence - Sarah was barren, they were elderly, and it seemed impossible. His faith despite impossibility was the ultimate righteousness.',
      whyMatters: 'Ramban teaches that faith isn\'t believing easy things - that\'s not faith, that\'s logic. Real faith means trusting God precisely when circumstances scream otherwise. Abraham\'s greatness was believing in life when everything pointed to death, in fertility when faced with barrenness, in future when trapped in present.',
      modernApplication: 'When your situation feels impossible - financially, relationally, health-wise - that\'s when faith matters most. Faith isn\'t denial of reality; it\'s seeing a deeper reality beyond current circumstances. Like Abraham, we can believe in invisible futures even when present evidence contradicts it.',
      questions: [
        'Where in your life are you called to "Abraham-level" faith right now?',
        'What\'s the difference between faith and denial?',
        'Have you ever believed something impossible that later came true? What sustained your belief?'
      ],
      connections: [
        {
          commentator: 'Chassidic interpretation',
          text: 'The Baal Shem Tov teaches that Abraham\'s faith created the reality. Our deep belief can actually bring things into existence. Faith isn\'t passive waiting - it\'s active creating.'
        }
      ],
      sefariaLink: 'https://www.sefaria.org/Ramban_on_Genesis.15.6'
    },
    {
      id: 'ohr_hachaim',
      name: 'Ohr HaChaim',
      reference: 'Genesis 12:1',
      english: 'The Ohr HaChaim notes that God tells Abraham to leave "your land, your birthplace, and your father\'s house" - three stages of separation, from easiest to hardest. Leaving your country is easier than leaving your hometown, which is easier than leaving family. God gives us challenges in progression, building our capacity gradually.',
      whyMatters: 'The Ohr HaChaim reveals God\'s pedagogy - divine teaching methodology. Growth happens in stages. We\'re not expected to immediately leap to the hardest change. Even Abraham, the father of faith, was given a graduated path. First geographical distance, then emotional distance, finally psychological distance.',
      modernApplication: 'When facing major life changes, break them into stages. Leaving a toxic job might mean: first updating resume (leaving "country"), then interviewing elsewhere (leaving "birthplace"), finally submitting resignation (leaving "father\'s house"). Gradual change is sustainable change.',
      questions: [
        'What growth challenge are you facing that could be broken into stages?',
        'Why does gradual progression work better than sudden leaps?',
        'What\'s your "father\'s house" - the hardest thing you\'d have to leave to fully grow?'
      ],
      connections: [
        {
          commentator: 'Modern psychology confirms',
          text: 'Behavioral psychology validates this: habit formation works through small, progressive steps. The Ohr HaChaim understood centuries ago what science now confirms about sustainable change.'
        }
      ],
      sefariaLink: 'https://www.sefaria.org/Ohr_HaChaim_on_Genesis.12.1'
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
