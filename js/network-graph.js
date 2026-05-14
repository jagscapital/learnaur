/**
 * ═══════════════════════════════════════════════════════════
 * TORAH CONNECTIONS NETWORK GRAPH - Phase 3
 * Visual representation of how verses, commentaries, and
 * concepts interconnect across the entire Torah
 * ═══════════════════════════════════════════════════════════
 */

const NetworkGraph = {

  /**
   * Create network graph visualization
   */
  async createGraph(reference, container) {
    if (!container) {
      console.error('Container required for graph');
      return;
    }

    // Show loading
    container.innerHTML = DOMPurify.sanitize(`
      <div class="graph-loading">
        <div class="loading-spinner"></div>
        <p>Building connection map for ${reference}...</p>
      </div>
    `);

    try {
      // Fetch cross-references
      const crossRefs = await fetchCrossReferences(reference);

      // Build graph data
      const graphData = this.buildGraphData(reference, crossRefs);

      // Render graph
      this.renderGraph(graphData, container);

    } catch (error) {
      console.error('Error creating graph:', error);
      container.innerHTML = DOMPurify.sanitize(`
        <div class="graph-error">
          <p>Could not create connection graph</p>
        </div>
      `);
    }
  },

  /**
   * Build graph data structure
   */
  buildGraphData(centerRef, crossRefs) {
    const nodes = [];
    const links = [];

    // Center node (the verse we're viewing)
    nodes.push({
      id: centerRef,
      label: centerRef,
      type: 'center',
      level: 0
    });

    // Add connected nodes by category
    let nodeIndex = 1;

    // Gemara nodes
    if (crossRefs.gemara && crossRefs.gemara.length > 0) {
      const gemaraNodes = crossRefs.gemara.slice(0, 8).map(ref => ({
        id: ref.reference || `gemara-${nodeIndex++}`,
        label: this.shortenReference(ref.reference),
        type: 'gemara',
        level: 1,
        fullRef: ref.reference
      }));

      nodes.push(...gemaraNodes);

      gemaraNodes.forEach(node => {
        links.push({
          source: centerRef,
          target: node.id,
          type: 'gemara'
        });
      });
    }

    // Midrash nodes
    if (crossRefs.midrash && crossRefs.midrash.length > 0) {
      const midrashNodes = crossRefs.midrash.slice(0, 6).map(ref => ({
        id: ref.reference || `midrash-${nodeIndex++}`,
        label: this.shortenReference(ref.reference),
        type: 'midrash',
        level: 1,
        fullRef: ref.reference
      }));

      nodes.push(...midrashNodes);

      midrashNodes.forEach(node => {
        links.push({
          source: centerRef,
          target: node.id,
          type: 'midrash'
        });
      });
    }

    // Other references
    if (crossRefs.other && crossRefs.other.length > 0) {
      const otherNodes = crossRefs.other.slice(0, 10).map(ref => ({
        id: ref.reference || `other-${nodeIndex++}`,
        label: this.shortenReference(ref.reference),
        type: 'other',
        level: 1,
        fullRef: ref.reference
      }));

      nodes.push(...otherNodes);

      otherNodes.forEach(node => {
        links.push({
          source: centerRef,
          target: node.id,
          type: 'other'
        });
      });
    }

    return { nodes, links };
  },

  /**
   * Shorten long references for display
   */
  shortenReference(ref) {
    if (!ref) return '';
    if (ref.length <= 20) return ref;

    // Extract book and key numbers
    const parts = ref.split(/[.:\s]/);
    if (parts.length > 2) {
      return `${parts[0]} ${parts[1]}:${parts[2]}`;
    }

    return ref.substring(0, 20) + '...';
  },

  /**
   * Render the graph using HTML/CSS (no D3.js needed!)
   */
  renderGraph(graphData, container) {
    const { nodes, links } = graphData;

    if (nodes.length <= 1) {
      container.innerHTML = DOMPurify.sanitize(`
        <div class="graph-empty">
          <p>No connections to visualize yet</p>
        </div>
      `);
      return;
    }

    // Calculate positions in a radial layout
    const positions = this.calculateRadialLayout(nodes);

    // Build HTML
    let html = '<div class="network-graph">';

    // Draw links first (so they appear behind nodes)
    html += '<svg class="graph-links">';
    links.forEach(link => {
      const sourcePos = positions[link.source];
      const targetPos = positions[link.target];

      if (sourcePos && targetPos) {
        const color = this.getLinkColor(link.type);
        html += `
          <line
            x1="${sourcePos.x}%"
            y1="${sourcePos.y}%"
            x2="${targetPos.x}%"
            y2="${targetPos.y}%"
            stroke="${color}"
            stroke-width="2"
            stroke-opacity="0.3"
          />
        `;
      }
    });
    html += '</svg>';

    // Draw nodes
    html += '<div class="graph-nodes">';
    nodes.forEach(node => {
      const pos = positions[node.id];
      if (!pos) return;

      const nodeClass = `graph-node graph-node-${node.type}`;
      const title = node.fullRef || node.label;

      html += `
        <div
          class="${nodeClass}"
          style="left: ${pos.x}%; top: ${pos.y}%;"
          title="${title}"
          data-ref="${node.fullRef || node.id}"
          onclick="window.open('https://www.sefaria.org/${encodeURIComponent(title)}', '_blank')"
        >
          <div class="node-label">${node.label}</div>
        </div>
      `;
    });
    html += '</div>';

    html += '</div>';

    // Legend
    html += `
      <div class="graph-legend">
        <div class="legend-item">
          <span class="legend-dot legend-dot-center"></span>
          <span>Current Verse</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot legend-dot-gemara"></span>
          <span>Talmud</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot legend-dot-midrash"></span>
          <span>Midrash</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot legend-dot-other"></span>
          <span>Torah References</span>
        </div>
      </div>
    `;

    html += `
      <div class="graph-hint">
        💡 Click any node to open on Sefaria
      </div>
    `;

    container.innerHTML = DOMPurify.sanitize(html);
  },

  /**
   * Calculate radial layout positions
   */
  calculateRadialLayout(nodes) {
    const positions = {};
    const centerX = 50;
    const centerY = 50;
    const radius = 35; // Percentage

    nodes.forEach((node, index) => {
      if (node.type === 'center') {
        // Center node in the middle
        positions[node.id] = { x: centerX, y: centerY };
      } else {
        // Arrange others in a circle
        const angle = (index / (nodes.length - 1)) * 2 * Math.PI;
        positions[node.id] = {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        };
      }
    });

    return positions;
  },

  /**
   * Get link color based on type
   */
  getLinkColor(type) {
    const colors = {
      'gemara': '#d4af37',
      'midrash': '#5b4b8a',
      'other': '#2b4c7e'
    };
    return colors[type] || '#555';
  }
};

// Export to window
window.NetworkGraph = NetworkGraph;

console.log('🕸️ Network graph system loaded');
