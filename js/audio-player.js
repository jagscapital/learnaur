/**
 * Audio Player for Torah Readings
 * Synchronized audio playback with text highlighting
 */

const TorahAudioPlayer = {
  player: null,
  currentVerse: null,
  isPlaying: false,
  playbackRate: 1.0,

  /**
   * Audio source options (placeholder URLs - will need actual recordings)
   */
  audioSources: {
    // Mechon Mamre style cantillation recordings
    // Format: book/chapter/verse
    baseURL: 'https://www.mechon-mamre.org/audio/',

    // Alternative: Chabad.org audio
    chabadURL: 'https://www.chabad.org/media/audio/',

    // Sefaria audio API (when available)
    sefariaURL: 'https://www.sefaria.org/api/audio/'
  },

  /**
   * Initialize audio player
   */
  init() {
    this.createPlayerUI();
    this.attachEventListeners();
  },

  /**
   * Create audio player UI
   */
  createPlayerUI() {
    const playerHTML = `
      <div class="audio-player" id="torahAudioPlayer" style="display: none;">
        <div class="audio-controls">
          <button class="audio-btn play-pause" id="playPauseBtn" aria-label="Play/Pause">
            <svg class="icon-play" width="24" height="24" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" fill="currentColor"/>
            </svg>
            <svg class="icon-pause" width="24" height="24" viewBox="0 0 24 24" style="display: none;">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" fill="currentColor"/>
            </svg>
          </button>

          <button class="audio-btn previous" id="prevVerseBtn" aria-label="Previous Verse">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" fill="currentColor"/>
            </svg>
          </button>

          <button class="audio-btn next" id="nextVerseBtn" aria-label="Next Verse">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path d="M16 18h2V6h-2v12zM6 18l8.5-6L6 6v12z" fill="currentColor"/>
            </svg>
          </button>

          <div class="audio-progress">
            <div class="progress-bar">
              <div class="progress-fill" id="progressFill"></div>
              <input type="range" class="progress-slider" id="progressSlider"
                     min="0" max="100" value="0" aria-label="Seek">
            </div>
            <div class="time-display">
              <span id="currentTime">0:00</span>
              <span class="time-separator">/</span>
              <span id="totalTime">0:00</span>
            </div>
          </div>

          <div class="audio-options">
            <button class="audio-btn speed" id="speedBtn" aria-label="Playback Speed">
              <span class="speed-label">1x</span>
            </button>

            <button class="audio-btn repeat" id="repeatBtn" aria-label="Repeat Verse">
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" fill="currentColor"/>
              </svg>
            </button>

            <button class="audio-btn volume" id="volumeBtn" aria-label="Volume">
              <svg class="icon-volume" width="24" height="24" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" fill="currentColor"/>
              </svg>
            </button>
            <input type="range" class="volume-slider" id="volumeSlider"
                   min="0" max="100" value="80" aria-label="Volume">
          </div>
        </div>

        <div class="now-playing">
          <div class="verse-info">
            <span class="verse-reference" id="verseReference">Genesis 1:1</span>
            <span class="verse-text" id="versePreview">בְּרֵאשִׁית בָּרָא אֱלֹהִים...</span>
          </div>
        </div>

        <audio id="audioElement" preload="metadata"></audio>
      </div>
    `;

    // Insert player into page
    const container = document.querySelector('.parsha-content') || document.body;
    container.insertAdjacentHTML('afterbegin', playerHTML);
  },

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    const playPauseBtn = document.getElementById('playPauseBtn');
    const prevBtn = document.getElementById('prevVerseBtn');
    const nextBtn = document.getElementById('nextVerseBtn');
    const speedBtn = document.getElementById('speedBtn');
    const repeatBtn = document.getElementById('repeatBtn');
    const volumeBtn = document.getElementById('volumeBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    const progressSlider = document.getElementById('progressSlider');
    const audioElement = document.getElementById('audioElement');

    if (playPauseBtn) {
      playPauseBtn.addEventListener('click', () => this.togglePlayPause());
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.previousVerse());
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextVerse());
    }

    if (speedBtn) {
      speedBtn.addEventListener('click', () => this.cycleSpeed());
    }

    if (repeatBtn) {
      repeatBtn.addEventListener('click', () => this.toggleRepeat());
    }

    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
    }

    if (progressSlider) {
      progressSlider.addEventListener('input', (e) => this.seek(e.target.value));
    }

    if (audioElement) {
      audioElement.addEventListener('timeupdate', () => this.updateProgress());
      audioElement.addEventListener('ended', () => this.onAudioEnded());
      audioElement.addEventListener('loadedmetadata', () => this.onMetadataLoaded());
    }
  },

  /**
   * Load and play verse audio
   */
  async playVerse(reference, verseText) {
    const audioElement = document.getElementById('audioElement');
    const playerContainer = document.getElementById('torahAudioPlayer');

    if (!audioElement || !playerContainer) return;

    // Show player
    playerContainer.style.display = 'block';

    // Update verse info
    this.currentVerse = reference;
    document.getElementById('verseReference').textContent = reference;
    document.getElementById('versePreview').textContent = verseText.substring(0, 50) + '...';

    // Try to load audio (this is a placeholder - needs actual audio source)
    const audioURL = this.getAudioURL(reference);

    try {
      audioElement.src = audioURL;
      await audioElement.play();
      this.isPlaying = true;
      this.updatePlayPauseButton();

      // Highlight current verse in text
      this.highlightVerse(reference);

    } catch (error) {
      console.warn('Audio not available for this verse:', error);
      // Fall back to text-to-speech if audio file not found
      this.speakVerse(verseText);
    }
  },

  /**
   * Get audio URL for verse
   */
  getAudioURL(reference) {
    // Parse reference (e.g., "Genesis 1:1")
    const parts = reference.split(' ');
    const book = parts[0].toLowerCase();
    const [chapter, verse] = parts[1].split(':');

    // TODO: Replace with actual audio source
    // For now, return placeholder URL
    return `${this.audioSources.baseURL}${book}/${chapter}/${verse}.mp3`;
  },

  /**
   * Text-to-speech fallback
   */
  speakVerse(text) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'he-IL'; // Hebrew
      utterance.rate = this.playbackRate;

      utterance.onend = () => {
        this.isPlaying = false;
        this.updatePlayPauseButton();
      };

      window.speechSynthesis.speak(utterance);
      this.isPlaying = true;
      this.updatePlayPauseButton();
    }
  },

  /**
   * Toggle play/pause
   */
  togglePlayPause() {
    const audioElement = document.getElementById('audioElement');

    if (this.isPlaying) {
      audioElement.pause();
      window.speechSynthesis.cancel();
      this.isPlaying = false;
    } else {
      audioElement.play();
      this.isPlaying = true;
    }

    this.updatePlayPauseButton();
  },

  /**
   * Update play/pause button icon
   */
  updatePlayPauseButton() {
    const playIcon = document.querySelector('.icon-play');
    const pauseIcon = document.querySelector('.icon-pause');

    if (this.isPlaying) {
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'block';
    } else {
      playIcon.style.display = 'block';
      pauseIcon.style.display = 'none';
    }
  },

  /**
   * Previous verse
   */
  previousVerse() {
    // TODO: Navigate to previous verse
    console.log('Previous verse');
  },

  /**
   * Next verse
   */
  nextVerse() {
    // TODO: Navigate to next verse
    console.log('Next verse');
  },

  /**
   * Cycle playback speed
   */
  cycleSpeed() {
    const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    const currentIndex = speeds.indexOf(this.playbackRate);
    const nextIndex = (currentIndex + 1) % speeds.length;

    this.playbackRate = speeds[nextIndex];

    const audioElement = document.getElementById('audioElement');
    if (audioElement) {
      audioElement.playbackRate = this.playbackRate;
    }

    const speedLabel = document.querySelector('.speed-label');
    if (speedLabel) {
      speedLabel.textContent = `${this.playbackRate}x`;
    }
  },

  /**
   * Toggle repeat mode
   */
  toggleRepeat() {
    const repeatBtn = document.getElementById('repeatBtn');
    const audioElement = document.getElementById('audioElement');

    if (audioElement.loop) {
      audioElement.loop = false;
      repeatBtn.classList.remove('active');
    } else {
      audioElement.loop = true;
      repeatBtn.classList.add('active');
    }
  },

  /**
   * Set volume
   */
  setVolume(value) {
    const audioElement = document.getElementById('audioElement');
    if (audioElement) {
      audioElement.volume = value / 100;
    }
  },

  /**
   * Seek to position
   */
  seek(value) {
    const audioElement = document.getElementById('audioElement');
    if (audioElement && audioElement.duration) {
      audioElement.currentTime = (value / 100) * audioElement.duration;
    }
  },

  /**
   * Update progress bar
   */
  updateProgress() {
    const audioElement = document.getElementById('audioElement');
    const progressFill = document.getElementById('progressFill');
    const progressSlider = document.getElementById('progressSlider');
    const currentTimeEl = document.getElementById('currentTime');

    if (!audioElement || !audioElement.duration) return;

    const percent = (audioElement.currentTime / audioElement.duration) * 100;

    if (progressFill) {
      progressFill.style.width = `${percent}%`;
    }

    if (progressSlider) {
      progressSlider.value = percent;
    }

    if (currentTimeEl) {
      currentTimeEl.textContent = this.formatTime(audioElement.currentTime);
    }
  },

  /**
   * On metadata loaded
   */
  onMetadataLoaded() {
    const audioElement = document.getElementById('audioElement');
    const totalTimeEl = document.getElementById('totalTime');

    if (audioElement && totalTimeEl) {
      totalTimeEl.textContent = this.formatTime(audioElement.duration);
    }
  },

  /**
   * On audio ended
   */
  onAudioEnded() {
    this.isPlaying = false;
    this.updatePlayPauseButton();

    // Auto-play next verse if not in repeat mode
    const audioElement = document.getElementById('audioElement');
    if (audioElement && !audioElement.loop) {
      this.nextVerse();
    }
  },

  /**
   * Format time (seconds to MM:SS)
   */
  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },

  /**
   * Highlight current verse in text
   */
  highlightVerse(reference) {
    // Remove previous highlights
    document.querySelectorAll('.verse-highlighted').forEach(el => {
      el.classList.remove('verse-highlighted');
    });

    // Add highlight to current verse
    const verseElement = document.querySelector(`[data-verse-ref="${reference}"]`);
    if (verseElement) {
      verseElement.classList.add('verse-highlighted');
      verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
};

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => TorahAudioPlayer.init());
} else {
  TorahAudioPlayer.init();
}

// Export for global access
window.TorahAudioPlayer = TorahAudioPlayer;
