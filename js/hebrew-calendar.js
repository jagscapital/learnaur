/**
 * ═══════════════════════════════════════════════════════════
 * HEBREW CALENDAR INTEGRATION
 * Handles Hebrew dates, Parsha calculations, and Jewish calendar
 * ═══════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────
// HEBREW DATE CALCULATION
// ─────────────────────────────────────────────

const HebrewCalendar = {
  months: {
    hebrew: [
      'ניסן', 'אייר', 'סיון', 'תמוז', 'אב', 'אלול',
      'תשרי', 'חשוון', 'כסלו', 'טבת', 'שבט', 'אדר'
    ],
    transliterated: [
      'Nisan', 'Iyar', 'Sivan', 'Tammuz', 'Av', 'Elul',
      'Tishrei', 'Cheshvan', 'Kislev', 'Tevet', 'Shevat', 'Adar'
    ]
  },

  parshiyot: {
    bereshit: [
      { name: 'Bereshit', hebrew: 'בראשית', book: 'Genesis' },
      { name: 'Noach', hebrew: 'נח', book: 'Genesis' },
      { name: 'Lech-Lecha', hebrew: 'לך לך', book: 'Genesis' },
      { name: 'Vayera', hebrew: 'וירא', book: 'Genesis' },
      { name: 'Chayei Sara', hebrew: 'חיי שרה', book: 'Genesis' },
      { name: 'Toldot', hebrew: 'תולדות', book: 'Genesis' },
      { name: 'Vayetzei', hebrew: 'ויצא', book: 'Genesis' },
      { name: 'Vayishlach', hebrew: 'וישלח', book: 'Genesis' },
      { name: 'Vayeshev', hebrew: 'וישב', book: 'Genesis' },
      { name: 'Miketz', hebrew: 'מקץ', book: 'Genesis' },
      { name: 'Vayigash', hebrew: 'ויגש', book: 'Genesis' },
      { name: 'Vayechi', hebrew: 'ויחי', book: 'Genesis' }
    ],
    shemot: [
      { name: 'Shemot', hebrew: 'שמות', book: 'Exodus' },
      { name: 'Vaera', hebrew: 'וארא', book: 'Exodus' },
      { name: 'Bo', hebrew: 'בא', book: 'Exodus' },
      { name: 'Beshalach', hebrew: 'בשלח', book: 'Exodus' },
      { name: 'Yitro', hebrew: 'יתרו', book: 'Exodus' },
      { name: 'Mishpatim', hebrew: 'משפטים', book: 'Exodus' },
      { name: 'Terumah', hebrew: 'תרומה', book: 'Exodus' },
      { name: 'Tetzaveh', hebrew: 'תצוה', book: 'Exodus' },
      { name: 'Ki Tisa', hebrew: 'כי תשא', book: 'Exodus' },
      { name: 'Vayakhel', hebrew: 'ויקהל', book: 'Exodus' },
      { name: 'Pekudei', hebrew: 'פקודי', book: 'Exodus' }
    ],
    vayikra: [
      { name: 'Vayikra', hebrew: 'ויקרא', book: 'Leviticus' },
      { name: 'Tzav', hebrew: 'צו', book: 'Leviticus' },
      { name: 'Shmini', hebrew: 'שמיני', book: 'Leviticus' },
      { name: 'Tazria', hebrew: 'תזריע', book: 'Leviticus' },
      { name: 'Metzora', hebrew: 'מצורע', book: 'Leviticus' },
      { name: 'Achrei Mot', hebrew: 'אחרי מות', book: 'Leviticus' },
      { name: 'Kedoshim', hebrew: 'קדושים', book: 'Leviticus' },
      { name: 'Emor', hebrew: 'אמור', book: 'Leviticus' },
      { name: 'Behar', hebrew: 'בהר', book: 'Leviticus' },
      { name: 'Bechukotai', hebrew: 'בחוקתי', book: 'Leviticus' }
    ],
    bamidbar: [
      { name: 'Bamidbar', hebrew: 'במדבר', book: 'Numbers' },
      { name: 'Nasso', hebrew: 'נשא', book: 'Numbers' },
      { name: 'Beha\'alotcha', hebrew: 'בהעלתך', book: 'Numbers' },
      { name: 'Sh\'lach', hebrew: 'שלח', book: 'Numbers' },
      { name: 'Korach', hebrew: 'קרח', book: 'Numbers' },
      { name: 'Chukat', hebrew: 'חקת', book: 'Numbers' },
      { name: 'Balak', hebrew: 'בלק', book: 'Numbers' },
      { name: 'Pinchas', hebrew: 'פינחס', book: 'Numbers' },
      { name: 'Matot', hebrew: 'מטות', book: 'Numbers' },
      { name: 'Masei', hebrew: 'מסעי', book: 'Numbers' }
    ],
    devarim: [
      { name: 'Devarim', hebrew: 'דברים', book: 'Deuteronomy' },
      { name: 'Vaetchanan', hebrew: 'ואתחנן', book: 'Deuteronomy' },
      { name: 'Eikev', hebrew: 'עקב', book: 'Deuteronomy' },
      { name: 'Re\'eh', hebrew: 'ראה', book: 'Deuteronomy' },
      { name: 'Shoftim', hebrew: 'שופטים', book: 'Deuteronomy' },
      { name: 'Ki Teitzei', hebrew: 'כי תצא', book: 'Deuteronomy' },
      { name: 'Ki Tavo', hebrew: 'כי תבוא', book: 'Deuteronomy' },
      { name: 'Nitzavim', hebrew: 'נצבים', book: 'Deuteronomy' },
      { name: 'Vayeilech', hebrew: 'וילך', book: 'Deuteronomy' },
      { name: 'Ha\'Azinu', hebrew: 'האזינו', book: 'Deuteronomy' },
      { name: 'V\'Zot HaBerachah', hebrew: 'וזאת הברכה', book: 'Deuteronomy' }
    ]
  }
};

/**
 * Get Hebrew date for today
 * Note: This is a simplified version. In production, use Hebcal API
 */
function getHebrewDate() {
  const today = new Date();

  // Use Hebcal API for accurate Hebrew dates
  // For now, we'll use a placeholder
  return formatHebrewDate(today);
}

/**
 * Format Hebrew date
 * In production, this would use actual Hebrew calendar calculations
 */
function formatHebrewDate(date) {
  // This is a placeholder - in production use Hebcal API
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const gregorian = date.toLocaleDateString('en-US', options);

  // Return formatted date (will be replaced with actual Hebrew date)
  return `Hebrew Date: ${gregorian}`;
}

/**
 * Get current week's Torah portion
 * Uses Hebcal API for accurate parsha calculation
 */
async function fetchCurrentParsha() {
  try {
    // Use Hebcal API for accurate parsha information
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    const url = `https://www.hebcal.com/shabbat?cfg=json&m=50&M=on&lg=s&date=${year}-${month}-${day}`;

    const response = await fetch(url);
    const data = await response.json();

    // Find the parsha in the response
    const parshaItem = data.items?.find(item => item.category === 'parashat');

    if (parshaItem) {
      return {
        name: parshaItem.title.replace('Parashat ', ''),
        hebrew: parshaItem.hebrew || '',
        date: parshaItem.date,
        link: parshaItem.link
      };
    }

    // Fallback to first parsha
    return HebrewCalendar.parshiyot.bereshit[0];

  } catch (error) {
    console.error('Error fetching parsha:', error);

    // Return fallback parsha
    return {
      name: 'Bereshit',
      hebrew: 'בראשית',
      book: 'Genesis'
    };
  }
}

/**
 * Get Hebrew date using Hebcal API
 */
async function fetchHebrewDate() {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    const url = `https://www.hebcal.com/converter?cfg=json&gy=${year}&gm=${month}&gd=${day}&g2h=1`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.hebrew) {
      return data.hebrew;
    }

    return getHebrewDate(); // Fallback
  } catch (error) {
    console.error('Error fetching Hebrew date:', error);
    return getHebrewDate(); // Fallback
  }
}

/**
 * Get all parshiyot for a given book
 */
function getParshiyotByBook(bookName) {
  const bookMap = {
    'Genesis': 'bereshit',
    'Exodus': 'shemot',
    'Leviticus': 'vayikra',
    'Numbers': 'bamidbar',
    'Deuteronomy': 'devarim'
  };

  const hebrewBook = bookMap[bookName];
  return hebrewBook ? HebrewCalendar.parshiyot[hebrewBook] : [];
}

/**
 * Get parsha by name
 */
function getParshaByName(name) {
  for (const book in HebrewCalendar.parshiyot) {
    const parsha = HebrewCalendar.parshiyot[book].find(
      p => p.name.toLowerCase() === name.toLowerCase() ||
           p.hebrew === name
    );
    if (parsha) return parsha;
  }
  return null;
}

/**
 * Calculate upcoming Shabbat
 */
function getUpcomingShabbat() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilShabbat = (6 - dayOfWeek + 7) % 7 || 7;

  const shabbat = new Date(today);
  shabbat.setDate(today.getDate() + daysUntilShabbat);

  return shabbat;
}

/**
 * Check if date is a Jewish holiday
 */
async function isHoliday(date) {
  try {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const url = `https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=on&mod=on&nx=on&year=${year}&month=${month}&day=${day}&ss=on&mf=on&c=on&geo=pos&latitude=31.7683&longitude=35.2137&tzid=Asia/Jerusalem&m=50`;

    const response = await fetch(url);
    const data = await response.json();

    return data.items && data.items.length > 0;
  } catch (error) {
    console.error('Error checking holiday:', error);
    return false;
  }
}

/**
 * Get Jewish year
 */
function getJewishYear() {
  // Approximate calculation - use Hebcal for accuracy
  const gregorianYear = new Date().getFullYear();
  return gregorianYear + 3760;
}

/**
 * Initialize Hebrew date display with API call
 */
async function initializeHebrewDateAPI() {
  const dateElement = document.getElementById('hebrewDate');
  if (!dateElement) return;

  try {
    const hebrewDate = await fetchHebrewDate();
    dateElement.textContent = hebrewDate;
  } catch (error) {
    console.error('Error initializing Hebrew date:', error);
    dateElement.textContent = getHebrewDate();
  }
}

// ─────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────
window.HebrewCalendar = HebrewCalendar;
window.getHebrewDate = getHebrewDate;
window.fetchCurrentParsha = fetchCurrentParsha;
window.fetchHebrewDate = fetchHebrewDate;
window.getParshiyotByBook = getParshiyotByBook;
window.getParshaByName = getParshaByName;
window.getUpcomingShabbat = getUpcomingShabbat;
window.isHoliday = isHoliday;
window.getJewishYear = getJewishYear;
window.initializeHebrewDateAPI = initializeHebrewDateAPI;
