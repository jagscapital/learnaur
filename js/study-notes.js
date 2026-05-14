/**
 * Study Notes and Bookmarks System
 * Personal annotations, highlights, and bookmarks with IndexedDB storage
 */

const StudyNotes = {
  db: null,
  dbName: 'TorahStudyNotesDB',
  dbVersion: 1,

  /**
   * Initialize database
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Notes store
        if (!db.objectStoreNames.contains('notes')) {
          const notesStore = db.createObjectStore('notes', { keyPath: 'id', autoIncrement: true });
          notesStore.createIndex('reference', 'reference', { unique: false });
          notesStore.createIndex('timestamp', 'timestamp', { unique: false });
          notesStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
        }

        // Bookmarks store
        if (!db.objectStoreNames.contains('bookmarks')) {
          const bookmarksStore = db.createObjectStore('bookmarks', { keyPath: 'id', autoIncrement: true });
          bookmarksStore.createIndex('reference', 'reference', { unique: true });
          bookmarksStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Highlights store
        if (!db.objectStoreNames.contains('highlights')) {
          const highlightsStore = db.createObjectStore('highlights', { keyPath: 'id', autoIncrement: true });
          highlightsStore.createIndex('reference', 'reference', { unique: false });
          highlightsStore.createIndex('color', 'color', { unique: false });
        }
      };
    });
  },

  /**
   * Add a note
   */
  async addNote(reference, content, tags = []) {
    if (!this.db) await this.init();

    const note = {
      reference,
      content,
      tags,
      timestamp: Date.now(),
      modified: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['notes'], 'readwrite');
      const store = transaction.objectStore('notes');
      const request = store.add(note);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Get all notes for a reference
   */
  async getNotes(reference) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['notes'], 'readonly');
      const store = transaction.objectStore('notes');
      const index = store.index('reference');
      const request = index.getAll(reference);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Update a note
   */
  async updateNote(id, content, tags) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['notes'], 'readwrite');
      const store = transaction.objectStore('notes');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const note = getRequest.result;
        if (!note) {
          reject(new Error('Note not found'));
          return;
        }

        note.content = content;
        note.tags = tags;
        note.modified = Date.now();

        const updateRequest = store.put(note);
        updateRequest.onsuccess = () => resolve();
        updateRequest.onerror = () => reject(updateRequest.error);
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  },

  /**
   * Delete a note
   */
  async deleteNote(id) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['notes'], 'readwrite');
      const store = transaction.objectStore('notes');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Add bookmark
   */
  async addBookmark(reference, title, notes = '') {
    if (!this.db) await this.init();

    const bookmark = {
      reference,
      title,
      notes,
      timestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['bookmarks'], 'readwrite');
      const store = transaction.objectStore('bookmarks');
      const request = store.add(bookmark);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Remove bookmark
   */
  async removeBookmark(reference) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['bookmarks'], 'readwrite');
      const store = transaction.objectStore('bookmarks');
      const index = store.index('reference');
      const request = index.getKey(reference);

      request.onsuccess = () => {
        if (request.result) {
          store.delete(request.result);
          resolve();
        } else {
          reject(new Error('Bookmark not found'));
        }
      };

      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Check if reference is bookmarked
   */
  async isBookmarked(reference) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['bookmarks'], 'readonly');
      const store = transaction.objectStore('bookmarks');
      const index = store.index('reference');
      const request = index.get(reference);

      request.onsuccess = () => resolve(!!request.result);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Get all bookmarks
   */
  async getAllBookmarks() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['bookmarks'], 'readonly');
      const store = transaction.objectStore('bookmarks');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Add highlight
   */
  async addHighlight(reference, text, color = 'yellow') {
    if (!this.db) await this.init();

    const highlight = {
      reference,
      text,
      color,
      timestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['highlights'], 'readwrite');
      const store = transaction.objectStore('highlights');
      const request = store.add(highlight);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Get highlights for reference
   */
  async getHighlights(reference) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['highlights'], 'readonly');
      const store = transaction.objectStore('highlights');
      const index = store.index('reference');
      const request = index.getAll(reference);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Delete highlight
   */
  async deleteHighlight(id) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['highlights'], 'readwrite');
      const store = transaction.objectStore('highlights');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Search notes by tag
   */
  async searchByTag(tag) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['notes'], 'readonly');
      const store = transaction.objectStore('notes');
      const index = store.index('tags');
      const request = index.getAll(tag);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Export all data (for backup)
   */
  async exportData() {
    if (!this.db) await this.init();

    const notes = await new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['notes'], 'readonly');
      const request = transaction.objectStore('notes').getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const bookmarks = await this.getAllBookmarks();

    const highlights = await new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['highlights'], 'readonly');
      const request = transaction.objectStore('highlights').getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return {
      notes,
      bookmarks,
      highlights,
      exportDate: new Date().toISOString(),
      version: this.dbVersion
    };
  },

  /**
   * Import data (from backup)
   */
  async importData(data) {
    if (!this.db) await this.init();

    const { notes, bookmarks, highlights } = data;

    // Import notes
    if (notes && notes.length > 0) {
      const transaction = this.db.transaction(['notes'], 'readwrite');
      const store = transaction.objectStore('notes');
      for (const note of notes) {
        delete note.id; // Let IndexedDB assign new IDs
        store.add(note);
      }
    }

    // Import bookmarks
    if (bookmarks && bookmarks.length > 0) {
      const transaction = this.db.transaction(['bookmarks'], 'readwrite');
      const store = transaction.objectStore('bookmarks');
      for (const bookmark of bookmarks) {
        delete bookmark.id;
        store.add(bookmark);
      }
    }

    // Import highlights
    if (highlights && highlights.length > 0) {
      const transaction = this.db.transaction(['highlights'], 'readwrite');
      const store = transaction.objectStore('highlights');
      for (const highlight of highlights) {
        delete highlight.id;
        store.add(highlight);
      }
    }
  }
};

/**
 * UI Components for Study Notes
 */
const StudyNotesUI = {
  /**
   * Create notes panel UI
   */
  createNotesPanel() {
    const panel = document.createElement('div');
    panel.className = 'study-notes-panel';
    panel.id = 'studyNotesPanel';
    panel.innerHTML = `
      <div class="panel-header">
        <h3>My Study Notes</h3>
        <button class="close-btn" id="closeNotesPanel" aria-label="Close">&times;</button>
      </div>
      <div class="panel-content">
        <div class="notes-list" id="notesList"></div>
        <div class="add-note-form">
          <textarea
            id="newNoteContent"
            placeholder="Add your insights and reflections..."
            rows="4"
            aria-label="New note content"
          ></textarea>
          <div class="note-tags">
            <input
              type="text"
              id="noteTags"
              placeholder="Tags (comma-separated)"
              aria-label="Note tags"
            />
          </div>
          <button class="btn-primary" id="saveNoteBtn">Save Note</button>
        </div>
      </div>
    `;

    document.body.appendChild(panel);
    this.attachEventListeners();
  },

  /**
   * Show notes for current verse
   */
  async showNotes(reference) {
    let panel = document.getElementById('studyNotesPanel');

    if (!panel) {
      this.createNotesPanel();
      panel = document.getElementById('studyNotesPanel');
    }

    panel.classList.add('visible');
    panel.dataset.currentReference = reference;

    const notes = await StudyNotes.getNotes(reference);
    this.renderNotes(notes);
  },

  /**
   * Render notes list
   */
  renderNotes(notes) {
    const notesList = document.getElementById('notesList');

    if (!notes || notes.length === 0) {
      notesList.innerHTML = '<p class="empty-state">No notes yet. Start by adding your first insight!</p>';
      return;
    }

    notesList.innerHTML = notes.map(note => `
      <div class="note-card" data-note-id="${note.id}">
        <div class="note-header">
          <div class="note-date">${new Date(note.timestamp).toLocaleDateString()}</div>
          <div class="note-actions">
            <button class="edit-note-btn" data-id="${note.id}" aria-label="Edit note">✏️</button>
            <button class="delete-note-btn" data-id="${note.id}" aria-label="Delete note">🗑️</button>
          </div>
        </div>
        <div class="note-content">${this.escapeHTML(note.content)}</div>
        ${note.tags && note.tags.length > 0 ? `
          <div class="note-tags-display">
            ${note.tags.map(tag => `<span class="tag">${this.escapeHTML(tag)}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    `).join('');
  },

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    const saveBtn = document.getElementById('saveNoteBtn');
    const closeBtn = document.getElementById('closeNotesPanel');

    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveNote());
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closePanel());
    }

    // Event delegation for note actions
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-note-btn')) {
        const id = parseInt(e.target.dataset.id);
        this.deleteNote(id);
      }
    });
  },

  /**
   * Save new note
   */
  async saveNote() {
    const content = document.getElementById('newNoteContent').value.trim();
    const tagsInput = document.getElementById('noteTags').value.trim();
    const panel = document.getElementById('studyNotesPanel');
    const reference = panel.dataset.currentReference;

    if (!content) {
      alert('Please enter some content for your note');
      return;
    }

    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()) : [];

    await StudyNotes.addNote(reference, content, tags);

    // Clear form
    document.getElementById('newNoteContent').value = '';
    document.getElementById('noteTags').value = '';

    // Refresh notes list
    const notes = await StudyNotes.getNotes(reference);
    this.renderNotes(notes);
  },

  /**
   * Delete note
   */
  async deleteNote(id) {
    if (!confirm('Are you sure you want to delete this note?')) return;

    await StudyNotes.deleteNote(id);

    const panel = document.getElementById('studyNotesPanel');
    const reference = panel.dataset.currentReference;
    const notes = await StudyNotes.getNotes(reference);
    this.renderNotes(notes);
  },

  /**
   * Close panel
   */
  closePanel() {
    const panel = document.getElementById('studyNotesPanel');
    if (panel) {
      panel.classList.remove('visible');
    }
  },

  /**
   * Escape HTML
   */
  escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
  await StudyNotes.init();
});

// Export for global access
window.StudyNotes = StudyNotes;
window.StudyNotesUI = StudyNotesUI;
