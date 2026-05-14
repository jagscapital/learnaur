/**
 * ═══════════════════════════════════════════════════════════
 * CONNECTIONS DISPLAY - Phase 2
 * Beautiful panels showing Talmud, Midrash, and cross-references
 * Transforms raw Sefaria links into engaging learning experiences
 * ═══════════════════════════════════════════════════════════
 */

const ConnectionsDisplay = {

  /**
   * Display all connections for a verse
   */
  async displayConnections(reference, container) {
    if (!container) {
      console.error('Container element required');
      return;
    }

    // Show loading
    container.innerHTML = DOMPurify.sanitize(`
      <div class="connections-loading">
        <div class="loading-spinner"></div>
        <p>Discovering connections across Torah, Talmud, and Midrash...</p>
      </div>
    `);

    try {
      // Fetch cross-references
      const crossRefs = await fetchCrossReferences(reference);

      // Build connection panels
      const html = this.buildConnectionsHTML(crossRefs, reference);
      container.innerHTML = DOMPurify.sanitize(html);

      // Add expand/collapse functionality
      this.initializeInteractions(container);

      // Phase 3: Render network graph if container exists
      const graphContainer = document.getElementById('networkGraphContainer');
      if (graphContainer && window.NetworkGraph && crossRefs) {
        window.NetworkGraph.createGraph(reference, graphContainer, crossRefs);
      }

    } catch (error) {
      console.error('Error displaying connections:', error);
      container.innerHTML = DOMPurify.sanitize(`
        <div class="connections-error">
          <p>❌ Could not load connections. Try refreshing.</p>
        </div>
      `);
    }
  },

  /**
   * Build HTML for all connection panels
   */
  buildConnectionsHTML(crossRefs, reference) {
    const sections = [];

    // Gemara (Talmud) connections
    if (crossRefs.gemara && crossRefs.gemara.length > 0) {
      sections.push(this.buildGemaraPanel(crossRefs.gemara));
    }

    // Midrash connections
    if (crossRefs.midrash && crossRefs.midrash.length > 0) {
      sections.push(this.buildMidrashPanel(crossRefs.midrash));
    }

    // Mishnah connections
    if (crossRefs.mishnah && crossRefs.mishnah.length > 0) {
      sections.push(this.buildMishnahPanel(crossRefs.mishnah));
    }

    // Other Torah references
    if (crossRefs.other && crossRefs.other.length > 0) {
      sections.push(this.buildOtherReferencesPanel(crossRefs.other));
    }

    if (sections.length === 0) {
      return `
        <div class="connections-empty">
          <div class="empty-icon">🔗</div>
          <h3>Exploring Connections</h3>
          <p>This verse stands beautifully on its own. Cross-references are being discovered.</p>
        </div>
      `;
    }

    return `
      <div class="connections-grid">
        ${sections.join('\n')}
      </div>
    `;
  },

  /**
   * Build Gemara (Talmud) panel
   */
  buildGemaraPanel(gemaraRefs) {
    const items = gemaraRefs.slice(0, 10).map(ref => `
      <div class="connection-item">
        <div class="connection-ref">
          <span class="ref-icon">📜</span>
          <a href="https://www.sefaria.org/${ref.reference}" target="_blank" class="ref-link">
            ${ref.reference}
          </a>
        </div>
        ${ref.english ? `<p class="connection-preview">${this.truncateText(ref.english, 150)}</p>` : ''}
      </div>
    `).join('');

    return `
      <div class="connection-panel gemara-panel">
        <div class="panel-header" data-panel="gemara">
          <div class="panel-title">
            <span class="panel-icon">📚</span>
            <h3>Talmudic Discussion</h3>
            <span class="panel-count">${gemaraRefs.length} ${gemaraRefs.length === 1 ? 'reference' : 'references'}</span>
          </div>
          <button class="panel-toggle">▼</button>
        </div>
        <div class="panel-content" data-panel-content="gemara">
          <p class="panel-intro">The Talmud explores the legal and philosophical dimensions of this verse:</p>
          <div class="connections-list">
            ${items}
          </div>
          ${gemaraRefs.length > 10 ? `<p class="more-refs">+ ${gemaraRefs.length - 10} more references in Talmud</p>` : ''}
        </div>
      </div>
    `;
  },

  /**
   * Build Midrash panel
   */
  buildMidrashPanel(midrashRefs) {
    const items = midrashRefs.slice(0, 8).map(ref => `
      <div class="connection-item">
        <div class="connection-ref">
          <span class="ref-icon">✨</span>
          <a href="https://www.sefaria.org/${ref.reference}" target="_blank" class="ref-link">
            ${ref.reference}
          </a>
        </div>
        ${ref.english ? `<p class="connection-preview">${this.truncateText(ref.english, 150)}</p>` : ''}
      </div>
    `).join('');

    return `
      <div class="connection-panel midrash-panel">
        <div class="panel-header" data-panel="midrash">
          <div class="panel-title">
            <span class="panel-icon">🌟</span>
            <h3>Midrashic Stories</h3>
            <span class="panel-count">${midrashRefs.length} ${midrashRefs.length === 1 ? 'reference' : 'references'}</span>
          </div>
          <button class="panel-toggle">▼</button>
        </div>
        <div class="panel-content" data-panel-content="midrash">
          <p class="panel-intro">Midrash reveals hidden layers and narrative expansions:</p>
          <div class="connections-list">
            ${items}
          </div>
          ${midrashRefs.length > 8 ? `<p class="more-refs">+ ${midrashRefs.length - 8} more Midrashic teachings</p>` : ''}
        </div>
      </div>
    `;
  },

  /**
   * Build Mishnah panel
   */
  buildMishnahPanel(mishnahRefs) {
    const items = mishnahRefs.slice(0, 6).map(ref => `
      <div class="connection-item">
        <div class="connection-ref">
          <span class="ref-icon">⚖️</span>
          <a href="https://www.sefaria.org/${ref.reference}" target="_blank" class="ref-link">
            ${ref.reference}
          </a>
        </div>
        ${ref.english ? `<p class="connection-preview">${this.truncateText(ref.english, 120)}</p>` : ''}
      </div>
    `).join('');

    return `
      <div class="connection-panel mishnah-panel">
        <div class="panel-header" data-panel="mishnah">
          <div class="panel-title">
            <span class="panel-icon">📖</span>
            <h3>Mishnaic Law</h3>
            <span class="panel-count">${mishnahRefs.length}</span>
          </div>
          <button class="panel-toggle">▼</button>
        </div>
        <div class="panel-content" data-panel-content="mishnah">
          <p class="panel-intro">The Mishnah codifies the practical laws derived from this verse:</p>
          <div class="connections-list">
            ${items}
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Build other references panel (Torah cross-refs, etc.)
   */
  buildOtherReferencesPanel(otherRefs) {
    const items = otherRefs.slice(0, 12).map(ref => `
      <div class="connection-item connection-item-compact">
        <span class="ref-icon">🔗</span>
        <a href="https://www.sefaria.org/${ref.reference}" target="_blank" class="ref-link">
          ${ref.reference}
        </a>
      </div>
    `).join('');

    return `
      <div class="connection-panel other-panel">
        <div class="panel-header" data-panel="other">
          <div class="panel-title">
            <span class="panel-icon">📝</span>
            <h3>Related Passages</h3>
            <span class="panel-count">${otherRefs.length}</span>
          </div>
          <button class="panel-toggle">▼</button>
        </div>
        <div class="panel-content" data-panel-content="other">
          <p class="panel-intro">This verse connects to other places in Torah and commentaries:</p>
          <div class="connections-list connections-list-compact">
            ${items}
          </div>
          ${otherRefs.length > 12 ? `<p class="more-refs">+ ${otherRefs.length - 12} more connections</p>` : ''}
        </div>
      </div>
    `;
  },

  /**
   * Initialize expand/collapse interactions
   */
  initializeInteractions(container) {
    const toggleButtons = container.querySelectorAll('.panel-toggle');

    toggleButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const header = e.target.closest('.panel-header');
        const panelName = header.dataset.panel;
        const content = container.querySelector(`[data-panel-content="${panelName}"]`);
        const panel = header.closest('.connection-panel');

        if (content) {
          const isExpanded = content.style.display !== 'none';

          if (isExpanded) {
            content.style.display = 'none';
            button.textContent = '▼';
            panel.classList.remove('expanded');
          } else {
            content.style.display = 'block';
            button.textContent = '▲';
            panel.classList.add('expanded');
          }
        }
      });
    });

    // Start with all panels expanded
    container.querySelectorAll('.panel-content').forEach(content => {
      content.style.display = 'block';
    });
    container.querySelectorAll('.panel-toggle').forEach(btn => {
      btn.textContent = '▲';
    });
    container.querySelectorAll('.connection-panel').forEach(panel => {
      panel.classList.add('expanded');
    });
  },

  /**
   * Truncate text to specified length
   */
  truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }
};

// Export to window
window.ConnectionsDisplay = ConnectionsDisplay;
