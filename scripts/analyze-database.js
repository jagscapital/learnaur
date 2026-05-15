const fs = require('fs');

const data = JSON.parse(fs.readFileSync('data/books_full.json', 'utf8'));

console.log('COMPLETE SEFARIA DATABASE ANALYSIS');
console.log('===================================\n');

console.log('Total books:', data.books.length);

// Analyze by category
const byCategory = {};
data.books.forEach(book => {
  const cat = book.categories[0] || 'Uncategorized';
  if (!byCategory[cat]) byCategory[cat] = { count: 0, books: [], hasEnglish: 0, hasHebrew: 0 };
  byCategory[cat].count++;
  byCategory[cat].books.push(book.title);

  if (book.versions) {
    if (book.versions.some(v => v.language === 'English')) byCategory[cat].hasEnglish++;
    if (book.versions.some(v => v.language === 'Hebrew')) byCategory[cat].hasHebrew++;
  }
});

console.log('\nBOOKS BY CATEGORY:');
Object.entries(byCategory)
  .sort((a,b) => b[1].count - a[1].count)
  .forEach(([cat, info]) => {
    console.log(`${cat}: ${info.count} books (${info.hasEnglish} English, ${info.hasHebrew} Hebrew)`);
  });

// Count versions
let totalVersions = 0;
let englishVersions = 0;
let hebrewVersions = 0;

data.books.forEach(book => {
  if (book.versions) {
    totalVersions += book.versions.length;
    englishVersions += book.versions.filter(v => v.language === 'English').length;
    hebrewVersions += book.versions.filter(v => v.language === 'Hebrew').length;
  }
});

console.log('\nVERSIONS:');
console.log('Total versions:', totalVersions);
console.log('English versions:', englishVersions);
console.log('Hebrew versions:', hebrewVersions);

// Priority texts
console.log('\nPRIORITY DOWNLOAD LIST:');
const priorities = [
  'Torah',
  'Rashi on Torah',
  'Ramban on Torah',
  'Ibn Ezra on Torah',
  'Sforno on Torah',
  'Major Talmud tractates',
  'Midrash Rabbah',
  'Mishnah'
];

console.log('1. Torah (5 books)');
console.log('2. Major Torah Commentaries (Rashi, Ramban, Ibn Ezra, Sforno)');
console.log('3. Complete Talmud (all tractates)');
console.log('4. Complete Midrash');
console.log('5. Complete Mishnah');
console.log('6. Kabbalah texts');
console.log('7. Chasidut texts');
console.log('8. Halakhah texts');
console.log('9. Everything else');

console.log('\nEstimated total files to download: ~85,000');
console.log('Estimated total size: ~26GB');
