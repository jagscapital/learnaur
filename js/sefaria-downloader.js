/**
 * Sefaria Database Downloader
 * Downloads and indexes the complete Sefaria dataset for comprehensive search
 */

const SefariaDownloader = {
  baseURL: 'https://storage.googleapis.com/sefaria-export/',
  downloadQueue: [],
  downloaded: 0,
  failed: [],

  /**
   * Priority texts for comprehensive search
   */
  essentialTexts: {
    // Torah with all major commentaries
    torah: [
      'json/Tanakh/Torah/Genesis/English/merged.json',
      'json/Tanakh/Torah/Genesis/Hebrew/merged.json',
      'json/Tanakh/Torah/Exodus/English/merged.json',
      'json/Tanakh/Torah/Exodus/Hebrew/merged.json',
      'json/Tanakh/Torah/Leviticus/English/merged.json',
      'json/Tanakh/Torah/Leviticus/Hebrew/merged.json',
      'json/Tanakh/Torah/Numbers/English/merged.json',
      'json/Tanakh/Torah/Numbers/Hebrew/merged.json',
      'json/Tanakh/Torah/Deuteronomy/English/merged.json',
      'json/Tanakh/Torah/Deuteronomy/Hebrew/merged.json'
    ],

    // Rashi on Torah
    rashi: [
      'json/Tanakh/Rishonim on Tanakh/Rashi/Torah/Rashi on Genesis/English/merged.json',
      'json/Tanakh/Rishonim on Tanakh/Rashi/Torah/Rashi on Exodus/English/merged.json',
      'json/Tanakh/Rishonim on Tanakh/Rashi/Torah/Rashi on Leviticus/English/merged.json',
      'json/Tanakh/Rishonim on Tanakh/Rashi/Torah/Rashi on Numbers/English/merged.json',
      'json/Tanakh/Rishonim on Tanakh/Rashi/Torah/Rashi on Deuteronomy/English/merged.json'
    ],

    // Other major commentators
    commentaries: [
      'json/Tanakh/Rishonim on Tanakh/Ramban/Torah/Ramban on Genesis/English/merged.json',
      'json/Tanakh/Rishonim on Tanakh/Ibn Ezra/Torah/Ibn Ezra on Genesis/English/merged.json',
      'json/Tanakh/Rishonim on Tanakh/Sforno/Torah/Sforno on Genesis/English/merged.json'
    ],

    // Major Talmud tractates
    talmud: [
      'json/Talmud/Bavli/Seder Zeraim/Berakhot/English/merged.json',
      'json/Talmud/Bavli/Seder Moed/Shabbat/English/merged.json',
      'json/Talmud/Bavli/Seder Nashim/Ketub
ot/English/merged.json'
    ],

    // Major Midrashim
    midrash: [
      'json/Midrash/Aggadic Midrash/Midrash Rabbah/Bereishit Rabbah/English/Sefaria Community Translation.json',
      'json/Midrash/Aggadic Midrash/Midrash Tanchuma/Tanchuma/English/merged.json'
    ]
  },

  /**
   * Download a specific file
   */
  async downloadFile(path, localPath) {
    const url = this.baseURL + path;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Store locally using IndexedDB
      await this.storeInDatabase(localPath, data);

      this.downloaded++;
      return { success: true, path, size: JSON.stringify(data).length };

    } catch (error) {
      this.failed.push({ path, error: error.message });
      return { success: false, path, error: error.message };
    }
  },

  /**
   * Store downloaded data in IndexedDB
   */
  async storeInDatabase(path, data) {
    if (!window.SefariaCache) {
      console.warn('SefariaCache not initialized');
      return;
    }

    const db = await window.SefariaCache.openDB();
    const transaction = db.transaction(['texts'], 'readwrite');
    const store = transaction.objectStore('texts');

    const record = {
      path,
      data,
      downloaded: Date.now(),
      size: JSON.stringify(data).length
    };

    await store.put(record);
  },

  /**
   * Download all essential texts
   */
  async downloadEssentials(progressCallback) {
    const allPaths = [
      ...this.essentialTexts.torah,
      ...this.essentialTexts.rashi,
      ...this.essentialTexts.commentaries,
      ...this.essentialTexts.talmud,
      ...this.essentialTexts.midrash
    ];

    const total = allPaths.length;
    let completed = 0;

    for (const path of allPaths) {
      const result = await this.downloadFile(path, path);
      completed++;

      if (progressCallback) {
        progressCallback({
          completed,
          total,
          current: path,
          success: result.success,
          percentComplete: Math.round((completed / total) * 100)
        });
      }

      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      total,
      downloaded: this.downloaded,
      failed: this.failed.length,
      failures: this.failed
    };
  },

  /**
   * Download texts by category from books.json
   */
  async downloadCategory(category, language = 'English', limit = null) {
    const booksResponse = await fetch('/data/books_full.json');
    const booksData = await booksResponse.json();

    const matchingBooks = booksData.books.filter(book => {
      return book.categories[0] === category;
    });

    let count = 0;
    for (const book of matchingBooks) {
      if (limit && count >= limit) break;

      // Find the appropriate version
      const version = book.versions?.find(v => v.language === language);
      if (!version) continue;

      const path = this.constructPath(book, version);
      await this.downloadFile(path, path);

      count++;
    }

    return { category, downloaded: count };
  },

  /**
   * Construct file path from book and version info
   */
  constructPath(book, version) {
    const categories = book.categories.join('/');
    const title = book.title;
    const language = version.language;
    const versionTitle = version.versionTitle.replace(/\s+/g, ' ');

    return `json/${categories}/${title}/${language}/${versionTitle}.json`;
  },

  /**
   * Get download progress
   */
  getProgress() {
    return {
      downloaded: this.downloaded,
      failed: this.failed.length,
      failures: this.failed
    };
  }
};

// Export
window.SefariaDownloader = SefariaDownloader;
