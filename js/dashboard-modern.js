/**
 * MODERN DASHBOARD JAVASCRIPT
 * Handles animations, stats counters, and interactive elements
 */

// ═══════════════════════════════════════════════════════════
// INITIALIZE ON DOM LOAD
// ═══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize core functionality
  await initializeHebrewDateAPI();
  await loadCurrentParsha();

  // Initialize stats counter animation
  initializeStatsCounters();

  // Initialize mobile menu
  initializeMobileMenu();

  // Initialize scroll effects
  initializeScrollEffects();
});

// ═══════════════════════════════════════════════════════════
// STATS COUNTER ANIMATION
// ═══════════════════════════════════════════════════════════

function initializeStatsCounters() {
  const counters = document.querySelectorAll('.stat-number-modern');

  if (counters.length === 0) return;

  // Create Intersection Observer to trigger animation when in view
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.5
  });

  counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element) {
  const target = parseInt(element.getAttribute('data-target'));
  const duration = 2000; // 2 seconds
  const frameDuration = 1000 / 60; // 60fps
  const totalFrames = Math.round(duration / frameDuration);
  let frame = 0;

  const counter = setInterval(() => {
    frame++;
    const progress = easeOutCubic(frame / totalFrames);
    const currentCount = Math.round(target * progress);

    element.textContent = currentCount.toLocaleString();

    if (frame === totalFrames) {
      clearInterval(counter);
      element.textContent = target.toLocaleString();
    }
  }, frameDuration);
}

// Easing function for smooth animation
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// ═══════════════════════════════════════════════════════════
// MOBILE MENU
// ═══════════════════════════════════════════════════════════

function initializeMobileMenu() {
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const navCenter = document.querySelector('.nav-center');

  if (!menuToggle || !navCenter) return;

  menuToggle.addEventListener('click', () => {
    navCenter.classList.toggle('mobile-open');
    menuToggle.classList.toggle('active');

    // Add mobile styles dynamically
    if (navCenter.classList.contains('mobile-open')) {
      navCenter.style.display = 'flex';
      navCenter.style.flexDirection = 'column';
      navCenter.style.position = 'absolute';
      navCenter.style.top = '72px';
      navCenter.style.left = '0';
      navCenter.style.right = '0';
      navCenter.style.background = '#000';
      navCenter.style.padding = '1rem';
      navCenter.style.borderTop = '1px solid rgba(255,255,255,0.1)';
      navCenter.style.zIndex = '999';
    } else {
      navCenter.style.display = '';
      navCenter.style.flexDirection = '';
      navCenter.style.position = '';
      navCenter.style.top = '';
      navCenter.style.left = '';
      navCenter.style.right = '';
      navCenter.style.background = '';
      navCenter.style.padding = '';
      navCenter.style.borderTop = '';
    }
  });
}

// ═══════════════════════════════════════════════════════════
// SCROLL EFFECTS
// ═══════════════════════════════════════════════════════════

function initializeScrollEffects() {
  const nav = document.querySelector('.nav-modern');
  let lastScroll = 0;

  if (!nav) return;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    // Add shadow on scroll
    if (currentScroll > 20) {
      nav.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)';
    } else {
      nav.style.boxShadow = 'none';
    }

    lastScroll = currentScroll;
  });

  // Animate elements on scroll
  const animateOnScroll = document.querySelectorAll('.card-modern, .access-card-modern');

  const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animation = 'slideUp 0.6s ease forwards';
        scrollObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1
  });

  animateOnScroll.forEach(el => {
    el.style.opacity = '0';
    scrollObserver.observe(el);
  });
}

// ═══════════════════════════════════════════════════════════
// LOAD CURRENT PARSHA
// ═══════════════════════════════════════════════════════════

async function loadCurrentParsha() {
  const parshaNameEl = document.getElementById('parshaName');

  if (!parshaNameEl) return;

  try {
    // Use Hebrew Calendar API to get current parsha
    const hebrewDate = await window.getHebrewDate?.() || await fetchHebrewDate();

    if (hebrewDate && hebrewDate.parshaName) {
      parshaNameEl.textContent = hebrewDate.parshaName;
    } else {
      // Fallback to static parsha if API fails
      parshaNameEl.textContent = 'Bereshit';
    }
  } catch (error) {
    console.error('Error loading parsha:', error);
    parshaNameEl.textContent = 'Bereshit';
  }
}

// Fallback function to fetch Hebrew date
async function fetchHebrewDate() {
  try {
    const today = new Date();
    const hebrewYear = today.getFullYear() + 3760;

    // This is a simplified fallback
    return {
      parshaName: 'Bereshit',
      hebrewDate: `1 Tishrei ${hebrewYear}`
    };
  } catch (error) {
    console.error('Fallback date error:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// SMOOTH SCROLL TO SECTIONS
// ═══════════════════════════════════════════════════════════

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');

    if (href === '#' || href === '') return;

    e.preventDefault();

    const target = document.querySelector(href);

    if (target) {
      const navHeight = document.querySelector('.nav-modern')?.offsetHeight || 72;
      const targetPosition = target.offsetTop - navHeight;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  });
});

// ═══════════════════════════════════════════════════════════
// SEARCH TRIGGER
// ═══════════════════════════════════════════════════════════

const searchTrigger = document.querySelector('.search-trigger');

if (searchTrigger) {
  searchTrigger.addEventListener('click', () => {
    // Redirect to search page
    window.location.href = 'search.html';
  });
}

// ═══════════════════════════════════════════════════════════
// PERFORMANCE: LAZY LOAD IMAGES (if any)
// ═══════════════════════════════════════════════════════════

if ('IntersectionObserver' in window) {
  const lazyImages = document.querySelectorAll('img[data-src]');

  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        imageObserver.unobserve(img);
      }
    });
  });

  lazyImages.forEach(img => imageObserver.observe(img));
}

// ═══════════════════════════════════════════════════════════
// KEYBOARD NAVIGATION
// ═══════════════════════════════════════════════════════════

document.addEventListener('keydown', (e) => {
  // Cmd/Ctrl + K for search
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    window.location.href = 'search.html';
  }
});

// ═══════════════════════════════════════════════════════════
// EXPORT FUNCTIONS
// ═══════════════════════════════════════════════════════════

window.dashboardModern = {
  initializeStatsCounters,
  loadCurrentParsha,
  animateCounter
};

console.log('✨ Modern Dashboard initialized');
