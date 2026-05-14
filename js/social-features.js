/**
 * Social Features
 * Share insights, study groups, and community learning
 */

const SocialFeatures = {
  /**
   * Share verse or insight
   */
  async shareVerse(reference, text, insight = '') {
    const shareData = {
      title: `Torah Study: ${reference}`,
      text: insight || text.substring(0, 200) + '...',
      url: `${window.location.origin}/parsha.html?ref=${encodeURIComponent(reference)}`
    };

    // Try Web Share API
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        console.log('Shared successfully');
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      this.copyToClipboard(`${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`);
      alert('Link copied to clipboard!');
    }
  },

  /**
   * Copy to clipboard
   */
  async copyToClipboard(text) {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  },

  /**
   * Generate shareable image (quote card)
   */
  generateQuoteCard(verse, reference) {
    // This would generate a beautiful card image
    // For now, return placeholder
    return `https://via.placeholder.com/800x400/2d3748/d4af37?text=${encodeURIComponent(reference)}`;
  },

  /**
   * Study group system (simplified)
   */
  studyGroups: {
    groups: [],

    createGroup(name, description, members = []) {
      const group = {
        id: Date.now(),
        name,
        description,
        members,
        created: new Date(),
        discussions: []
      };

      this.groups.push(group);
      return group;
    },

    addDiscussion(groupId, topic, reference) {
      const group = this.groups.find(g => g.id === groupId);
      if (!group) return;

      group.discussions.push({
        id: Date.now(),
        topic,
        reference,
        messages: [],
        created: new Date()
      });
    }
  },

  /**
   * Community insights (simplified)
   */
  insights: {
    all: [],

    addInsight(reference, content, author = 'Anonymous') {
      const insight = {
        id: Date.now(),
        reference,
        content,
        author,
        likes: 0,
        created: new Date()
      };

      this.all.push(insight);
      return insight;
    },

    getInsights(reference) {
      return this.all.filter(i => i.reference === reference);
    },

    likeInsight(id) {
      const insight = this.all.find(i => i.id === id);
      if (insight) insight.likes++;
    }
  }
};

// Export
window.SocialFeatures = SocialFeatures;
