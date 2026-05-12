/**
 * ═══════════════════════════════════════════════════════════
 * TORAH STUDY PLATFORM — CORE FUNCTIONALITY
 * ═══════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────
// GLOBAL STATE
// ─────────────────────────────────────────────
const TorahPlatform = {
  currentParsha: null,
  hebrewDate: null,
  cache: new Map(),
  settings: {
    prefetchEnabled: true,
    animationsEnabled: true,
    hebrewMode: 'ashkenaz' // or 'sephardi'
  }
};

// ─────────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initializeScrollEffects();
  initializeNavigation();
  initializeTransitions();
  createScrollProgress();
  initializeParticles();
});

// ─────────────────────────────────────────────
// SCROLL EFFECTS
// ─────────────────────────────────────────────
function initializeScrollEffects() {
  // Observe elements for scroll-based animations
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    }
  );

  // Observe all scroll-fade elements
  document.querySelectorAll('.scroll-fade').forEach(el => {
    observer.observe(el);
  });

  // Parallax effect on scroll
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        handleParallax();
        updateScrollProgress();
        ticking = false;
      });
      ticking = true;
    }
  });
}

function handleParallax() {
  const scrolled = window.pageYOffset;
  const parallaxElements = document.querySelectorAll('.parallax-layer');

  parallaxElements.forEach((el, index) => {
    const speed = (index + 1) * 0.1;
    el.style.transform = `translateY(${scrolled * speed}px)`;
  });
}

// ─────────────────────────────────────────────
// SCROLL PROGRESS INDICATOR
// ─────────────────────────────────────────────
function createScrollProgress() {
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  document.body.appendChild(progressBar);
}

function updateScrollProgress() {
  const scrollProgress = document.querySelector('.scroll-progress');
  if (!scrollProgress) return;

  const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolled = (window.pageYOffset / windowHeight) * 100;

  scrollProgress.style.width = `${scrolled}%`;
}

// ─────────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────────
function initializeNavigation() {
  const nav = document.querySelector('.main-nav');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
      nav.style.background = 'rgba(13, 13, 21, 0.95)';
      nav.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.4)';
    } else {
      nav.style.background = 'rgba(13, 13, 21, 0.85)';
      nav.style.boxShadow = 'none';
    }

    lastScroll = currentScroll;
  });
}

// ─────────────────────────────────────────────
// PAGE TRANSITIONS
// ─────────────────────────────────────────────
function initializeTransitions() {
  // Create transition overlay
  const transition = document.createElement('div');
  transition.className = 'page-transition';
  transition.innerHTML = DOMPurify.sanitize(`
    <div class="transition-content">
      <div class="transition-spinner"></div>
      <p>Loading...</p>
    </div>
  `);
  document.body.appendChild(transition);

  // Intercept navigation
  document.querySelectorAll('a[href^="/"], a[href^="./"], a[href^="../"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('#')) {
        e.preventDefault();
        transitionToPage(href);
      }
    });
  });
}

function transitionToPage(url) {
  const transition = document.querySelector('.page-transition');
  transition.classList.add('active');

  setTimeout(() => {
    window.location.href = url;
  }, 600);
}

// ─────────────────────────────────────────────
// STATS ANIMATION
// ─────────────────────────────────────────────
function animateStats() {
  const stats = document.querySelectorAll('.stat-number');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateNumber(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  stats.forEach(stat => observer.observe(stat));
}

function animateNumber(element) {
  const target = parseInt(element.textContent.replace(/,/g, ''));
  const duration = 2000;
  const increment = target / (duration / 16);
  let current = 0;

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    element.textContent = Math.floor(current).toLocaleString();
  }, 16);
}

// ─────────────────────────────────────────────
// HEBREW DATE DISPLAY
// ─────────────────────────────────────────────
function initializeHebrewDate() {
  const dateElement = document.getElementById('hebrewDate');
  if (!dateElement) return;

  // This will be replaced by actual Hebrew calendar calculation
  const hebrewDate = getHebrewDate();
  dateElement.textContent = hebrewDate;
  TorahPlatform.hebrewDate = hebrewDate;
}

// ─────────────────────────────────────────────
// CURRENT PARSHA LOADING
// ─────────────────────────────────────────────
async function loadCurrentParsha() {
  const parshaElement = document.getElementById('parshaName');
  if (!parshaElement) return;

  try {
    // Check cache first
    const cached = TorahPlatform.cache.get('currentParsha');
    if (cached && isWithinWeek(cached.timestamp)) {
      displayParsha(cached.data);
      return;
    }

    // Fetch from API
    const parsha = await fetchCurrentParsha();

    // Cache the result
    TorahPlatform.cache.set('currentParsha', {
      data: parsha,
      timestamp: Date.now()
    });

    displayParsha(parsha);
  } catch (error) {
    console.error('Error loading parsha:', error);
    parshaElement.textContent = 'Torah Portion';
  }
}

function displayParsha(parsha) {
  const parshaElement = document.getElementById('parshaName');
  if (parshaElement && parsha) {
    parshaElement.textContent = parsha.hebrew || parsha.name;
    TorahPlatform.currentParsha = parsha;
  }
}

// ─────────────────────────────────────────────
// CACHE UTILITIES
// ─────────────────────────────────────────────
function isWithinWeek(timestamp) {
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - timestamp < oneWeek;
}

function clearOldCache() {
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  TorahPlatform.cache.forEach((value, key) => {
    if (now - value.timestamp > oneWeek) {
      TorahPlatform.cache.delete(key);
    }
  });
}

// ─────────────────────────────────────────────
// LOCAL STORAGE
// ─────────────────────────────────────────────
function saveToLocalStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('LocalStorage unavailable:', e);
  }
}

function loadFromLocalStorage(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.warn('LocalStorage unavailable:', e);
    return null;
  }
}

// ─────────────────────────────────────────────
// PREFETCH SYSTEM
// ─────────────────────────────────────────────
function prefetchWeeklyContent() {
  if (!TorahPlatform.settings.prefetchEnabled) return;

  // Prefetch parsha page
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = 'parsha.html';
  document.head.appendChild(link);

  // Prefetch davening page
  const link2 = document.createElement('link');
  link2.rel = 'prefetch';
  link2.href = 'davening.html';
  document.head.appendChild(link2);
}

// ─────────────────────────────────────────────
// ERROR HANDLING
// ─────────────────────────────────────────────
window.addEventListener('error', (event) => {
  console.error('Platform Error:', event.error);
  // Could send to error tracking service
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason);
});

// ─────────────────────────────────────────────
// PERFORMANCE MONITORING
// ─────────────────────────────────────────────
if ('PerformanceObserver' in window) {
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.duration > 100) {
        console.warn('Slow operation detected:', entry.name, entry.duration);
      }
    });
  });

  observer.observe({ entryTypes: ['measure'] });
}

// ─────────────────────────────────────────────
// CINEMATIC PARTICLE EFFECTS
// ─────────────────────────────────────────────
function initializeParticles() {
  const particleContainer = document.getElementById('particles');
  if (!particleContainer) return;

  // Create 20 floating particles
  for (let i = 0; i < 20; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';

    // Random positioning
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.animationDelay = `${Math.random() * 15}s`;
    particle.style.animationDuration = `${15 + Math.random() * 10}s`;

    // Random size
    const size = 2 + Math.random() * 2;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;

    particleContainer.appendChild(particle);
  }
}

// ─────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────
window.TorahPlatform = TorahPlatform;
window.saveToLocalStorage = saveToLocalStorage;
window.loadFromLocalStorage = loadFromLocalStorage;
window.animateStats = animateStats;
window.loadCurrentParsha = loadCurrentParsha;
window.initializeHebrewDate = initializeHebrewDate;
