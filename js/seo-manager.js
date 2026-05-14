/**
 * SEO Manager
 * Handles meta tags, structured data, and search engine optimization
 */

const SEOManager = {
  /**
   * Update page meta tags
   */
  updateMetaTags(config) {
    const {
      title,
      description,
      keywords,
      image,
      url,
      type = 'website'
    } = config;

    // Update title
    if (title) {
      document.title = `${title} — Torah Study Platform`;

      // Update Open Graph title
      this.setMeta('og:title', title);
      this.setMeta('twitter:title', title);
    }

    // Update description
    if (description) {
      this.setMeta('description', description);
      this.setMeta('og:description', description);
      this.setMeta('twitter:description', description);
    }

    // Update keywords
    if (keywords) {
      this.setMeta('keywords', keywords.join(', '));
    }

    // Update image
    if (image) {
      this.setMeta('og:image', image);
      this.setMeta('twitter:image', image);
    }

    // Update URL
    if (url) {
      this.setMeta('og:url', url);
      this.setLink('canonical', url);
    }

    // Update type
    this.setMeta('og:type', type);
  },

  /**
   * Set meta tag
   */
  setMeta(name, content) {
    let meta = document.querySelector(`meta[name="${name}"]`) ||
               document.querySelector(`meta[property="${name}"]`);

    if (!meta) {
      meta = document.createElement('meta');
      if (name.startsWith('og:') || name.startsWith('twitter:')) {
        meta.setAttribute('property', name);
      } else {
        meta.setAttribute('name', name);
      }
      document.head.appendChild(meta);
    }

    meta.setAttribute('content', content);
  },

  /**
   * Set link tag
   */
  setLink(rel, href) {
    let link = document.querySelector(`link[rel="${rel}"]`);

    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', rel);
      document.head.appendChild(link);
    }

    link.setAttribute('href', href);
  },

  /**
   * Generate structured data (JSON-LD) for a parsha
   */
  generateParshaStructuredData(parsha) {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": `${parsha.english} (${parsha.hebrew}) - Weekly Torah Portion`,
      "description": parsha.summary,
      "author": {
        "@type": "Organization",
        "name": "Torah Study Platform"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Torah Study Platform",
        "logo": {
          "@type": "ImageObject",
          "url": "https://learnaur.simcha-cec.workers.dev/images/logo.png"
        }
      },
      "datePublished": new Date().toISOString(),
      "articleSection": parsha.book,
      "keywords": parsha.themes.join(', '),
      "about": {
        "@type": "Thing",
        "name": parsha.english,
        "alternateName": parsha.hebrew
      }
    };

    this.insertStructuredData(structuredData);
  },

  /**
   * Insert structured data script
   */
  insertStructuredData(data) {
    // Remove existing structured data
    const existing = document.querySelector('script[type="application/ld+json"]');
    if (existing) {
      existing.remove();
    }

    // Insert new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data, null, 2);
    document.head.appendChild(script);
  },

  /**
   * Generate sitemap
   */
  async generateSitemap() {
    const baseURL = 'https://learnaur.simcha-cec.workers.dev';
    const pages = [
      { url: '/', priority: 1.0, changefreq: 'daily' },
      { url: '/parsha.html', priority: 0.9, changefreq: 'daily' },
      { url: '/davening.html', priority: 0.8, changefreq: 'weekly' },
      { url: '/search.html', priority: 0.7, changefreq: 'weekly' }
    ];

    // Add all parshiyot
    if (window.ParshiyotDatabase) {
      window.ParshiyotDatabase.parshiyot.forEach(parsha => {
        pages.push({
          url: `/parsha.html?p=${parsha.english.toLowerCase()}`,
          priority: 0.8,
          changefreq: 'monthly'
        });
      });
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${baseURL}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    return xml;
  },

  /**
   * Generate robots.txt
   */
  generateRobotsTxt() {
    return `User-agent: *
Allow: /
Sitemap: https://learnaur.simcha-cec.workers.dev/sitemap.xml

# Google
User-agent: Googlebot
Allow: /

# Bing
User-agent: Bingbot
Allow: /

# Disallow heavy data files
Disallow: /data/
`;
  }
};

// Export
window.SEOManager = SEOManager;
