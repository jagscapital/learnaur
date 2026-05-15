/**
 * Complete Sefaria Database Downloader
 * Downloads ALL 19,643 books from books_full.json index
 * Downloads JSON files to data/sefaria-full/
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const BOOKS_INDEX = path.join(__dirname, '..', 'data', 'books_full.json');
const DATA_DIR = path.join(__dirname, '..', 'data', 'sefaria-full');
const PROGRESS_FILE = path.join(DATA_DIR, 'download-progress-complete.json');

// Progress tracking
let totalBooks = 0;
let downloadedBooks = 0;
let skippedBooks = 0;
let failedBooks = [];
let downloadedBytes = 0;
let categoryProgress = {};

// Create data directory
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Load progress from previous run
 */
function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      const progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
      console.log('📂 Resuming from previous download...');
      console.log(`   Previously downloaded: ${progress.downloadedBooks} books`);
      console.log(`   Previously failed: ${progress.failedBooks.length} books`);
      return progress;
    } catch (error) {
      console.log('⚠️  Could not load progress, starting fresh');
    }
  }
  return null;
}

/**
 * Save progress
 */
function saveProgress() {
  const progress = {
    totalBooks,
    downloadedBooks,
    skippedBooks,
    failedBooks,
    downloadedBytes,
    categoryProgress,
    lastUpdate: new Date().toISOString()
  };

  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

/**
 * Convert URL to local file path
 */
function urlToLocalPath(url) {
  // Extract path after sefaria-export/
  const match = url.match(/sefaria-export\/(.+)/);
  if (!match) return null;

  const relativePath = decodeURIComponent(match[1]);
  return path.join(DATA_DIR, relativePath);
}

/**
 * Download a single file
 */
function downloadFile(url, localPath) {
  return new Promise((resolve, reject) => {
    // Create directory if needed
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Check if already exists
    if (fs.existsSync(localPath)) {
      const stats = fs.statSync(localPath);
      if (stats.size > 0) {
        skippedBooks++;
        resolve({ cached: true, path: localPath, size: stats.size });
        return;
      }
    }

    const file = fs.createWriteStream(localPath);
    let responseReceived = false;

    const request = https.get(url, (response) => {
      responseReceived = true;

      if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirects
        const redirectUrl = response.headers.location;
        file.close();
        fs.unlinkSync(localPath);
        return downloadFile(redirectUrl, localPath).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(localPath, () => {});
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
      let downloadedChunk = 0;

      response.on('data', (chunk) => {
        downloadedChunk += chunk.length;
        downloadedBytes += chunk.length;
      });

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        downloadedBooks++;
        resolve({ cached: false, path: localPath, bytes: totalBytes });
      });
    });

    request.on('error', (err) => {
      if (responseReceived) return; // Already handled
      file.close();
      fs.unlink(localPath, () => {});
      reject(err);
    });

    request.setTimeout(30000, () => {
      request.destroy();
      file.close();
      fs.unlink(localPath, () => {});
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Format bytes
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

/**
 * Sleep function
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Download books by category
 */
async function downloadCategory(categoryName, books) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`CATEGORY: ${categoryName} (${books.length} books)`);
  console.log('='.repeat(70));

  categoryProgress[categoryName] = {
    total: books.length,
    downloaded: 0,
    skipped: 0,
    failed: 0
  };

  let count = 0;
  const batchSize = 10; // Download 10 at a time, then save progress

  for (const book of books) {
    count++;

    // Show progress every 10 books
    if (count % 10 === 0 || count === books.length) {
      const percent = ((count / books.length) * 100).toFixed(1);
      process.stdout.write(`\r📥 Progress: ${count}/${books.length} (${percent}%) - Downloaded: ${formatBytes(downloadedBytes)}    `);
    }

    const url = book.json_url;
    if (!url) {
      categoryProgress[categoryName].failed++;
      continue;
    }

    const localPath = urlToLocalPath(url);
    if (!localPath) {
      categoryProgress[categoryName].failed++;
      continue;
    }

    try {
      const result = await downloadFile(url, localPath);

      if (result.cached) {
        categoryProgress[categoryName].skipped++;
      } else {
        categoryProgress[categoryName].downloaded++;
      }

      // Small delay to be nice to the server
      await sleep(50);

      // Save progress every batch
      if (count % batchSize === 0) {
        saveProgress();
      }

    } catch (error) {
      categoryProgress[categoryName].failed++;
      failedBooks.push({
        title: book.title,
        category: categoryName,
        url: url,
        error: error.message
      });
    }
  }

  console.log(''); // New line after progress
  console.log(`✓ Category complete: ${categoryName}`);
  console.log(`  Downloaded: ${categoryProgress[categoryName].downloaded}`);
  console.log(`  Skipped (cached): ${categoryProgress[categoryName].skipped}`);
  console.log(`  Failed: ${categoryProgress[categoryName].failed}`);

  saveProgress();
}

/**
 * Main download process
 */
async function main() {
  console.log('╔═════════════════════════════════════════════════════════════════════╗');
  console.log('║     SEFARIA COMPLETE DATABASE DOWNLOADER v2.0                       ║');
  console.log('║     Downloading ALL 19,643 books from Sefaria                       ║');
  console.log('╚═════════════════════════════════════════════════════════════════════╝\n');

  // Load books index
  console.log('📖 Loading books index...');
  const booksData = JSON.parse(fs.readFileSync(BOOKS_INDEX, 'utf8'));
  const allBooks = booksData.books;
  totalBooks = allBooks.length;

  console.log(`✓ Loaded ${totalBooks.toLocaleString()} books\n`);

  // Load previous progress
  const prevProgress = loadProgress();

  // Group books by category
  const booksByCategory = {};
  for (const book of allBooks) {
    const category = book.categories[0] || 'Uncategorized';
    if (!booksByCategory[category]) {
      booksByCategory[category] = [];
    }
    booksByCategory[category].push(book);
  }

  // Sort categories by priority
  const priorityOrder = [
    'Tanakh',
    'Talmud',
    'Mishnah',
    'Tosefta',
    'Midrash',
    'Halakhah',
    'Kabbalah',
    'Chasidut',
    'Musar',
    'Jewish Thought',
    'Liturgy',
    'Responsa',
    'Second Temple',
    'Reference'
  ];

  const sortedCategories = [];
  for (const cat of priorityOrder) {
    if (booksByCategory[cat]) {
      sortedCategories.push([cat, booksByCategory[cat]]);
    }
  }

  // Add any remaining categories not in priority list
  for (const [cat, books] of Object.entries(booksByCategory)) {
    if (!priorityOrder.includes(cat)) {
      sortedCategories.push([cat, books]);
    }
  }

  console.log('📊 Download Plan:');
  for (const [category, books] of sortedCategories) {
    console.log(`   ${category.padEnd(25)} ${books.length.toString().padStart(5)} books`);
  }
  console.log('');

  const startTime = Date.now();

  // Download each category
  for (const [category, books] of sortedCategories) {
    await downloadCategory(category, books);
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(0);

  console.log('\n' + '═'.repeat(70));
  console.log('DOWNLOAD COMPLETE');
  console.log('═'.repeat(70));
  console.log(`Total books: ${totalBooks.toLocaleString()}`);
  console.log(`Downloaded: ${downloadedBooks.toLocaleString()}`);
  console.log(`Skipped (cached): ${skippedBooks.toLocaleString()}`);
  console.log(`Failed: ${failedBooks.length.toLocaleString()}`);
  console.log(`Total data downloaded: ${formatBytes(downloadedBytes)}`);
  console.log(`Time taken: ${duration} seconds`);
  console.log(`Download speed: ${((downloadedBytes / 1024 / 1024) / (duration / 60)).toFixed(2)} MB/min`);

  if (failedBooks.length > 0) {
    console.log(`\n⚠️  ${failedBooks.length} books failed to download`);
    console.log('Failed books saved to download-progress-complete.json');

    // Show first 10 failures
    console.log('\nFirst 10 failures:');
    failedBooks.slice(0, 10).forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.title} (${f.category})`);
      console.log(`     ${f.error}`);
    });
  }

  console.log('\n✓ Progress saved to: download-progress-complete.json');
  console.log(`✓ Data stored in: ${DATA_DIR}`);
}

// Run
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  saveProgress();
  process.exit(1);
});
