/**
 * Talmud Study Mode
 * Gemara learning with Rashi, Tosafot, and modern commentary
 */

const TalmudStudy = {
  baseURL: 'https://www.sefaria.org/api',

  /**
   * Load Talmud page (Daf)
   */
  async loadDaf(tractate, daf) {
    const reference = `${tractate}.${daf}`;
    const url = `${this.baseURL}/texts/${reference}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      return {
        hebrew: data.he || [],
        english: data.text || [],
        reference: data.ref,
        sections: data.sections
      };
    } catch (error) {
      console.error('Error loading Talmud:', error);
      return null;
    }
  },

  /**
   * Load Rashi on Talmud
   */
  async loadRashi(tractate, daf) {
    const reference = `Rashi on ${tractate}.${daf}`;
    return this.loadCommentary(reference);
  },

  /**
   * Load Tosafot
   */
  async loadTosafot(tractate, daf) {
    const reference = `Tosafot on ${tractate}.${daf}`;
    return this.loadCommentary(reference);
  },

  /**
   * Load commentary
   */
  async loadCommentary(reference) {
    const url = `${this.baseURL}/texts/${encodeURIComponent(reference)}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      return {
        hebrew: data.he || [],
        english: data.text || [],
        reference: data.ref
      };
    } catch (error) {
      console.error('Error loading commentary:', error);
      return null;
    }
  },

  /**
   * Tractate list
   */
  tractates: [
    { name: 'Berakhot', pages: 63 },
    { name: 'Shabbat', pages: 156 },
    { name: 'Eruvin', pages: 104 },
    { name: 'Pesachim', pages: 120 },
    { name: 'Yoma', pages: 87 },
    { name: 'Sukkah', pages: 55 },
    { name: 'Beitzah', pages: 39 },
    { name: 'Rosh Hashanah', pages: 34 },
    { name: 'Taanit', pages: 30 },
    { name: 'Megillah', pages: 31 },
    { name: 'Moed Katan', pages: 28 },
    { name: 'Chagigah', pages: 26 },
    { name: 'Yevamot', pages: 121 },
    { name: 'Ketubot', pages: 111 },
    { name: 'Nedarim', pages: 90 },
    { name: 'Nazir', pages: 65 },
    { name: 'Sotah', pages: 48 },
    { name: 'Gittin', pages: 89 },
    { name: 'Kiddushin', pages: 81 },
    { name: 'Bava Kamma', pages: 118 },
    { name: 'Bava Metzia', pages: 118 },
    { name: 'Bava Batra', pages: 175 },
    { name: 'Sanhedrin', pages: 112 },
    { name: 'Makkot', pages: 23 },
    { name: 'Shevuot', pages: 48 },
    { name: 'Avodah Zarah', pages: 75 },
    { name: 'Horayot', pages: 13 },
    { name: 'Zevachim', pages: 119 },
    { name: 'Menachot', pages: 109 },
    { name: 'Chullin', pages: 141 },
    { name: 'Bekhorot', pages: 60 },
    { name: 'Arakhin', pages: 33 },
    { name: 'Temurah', pages: 33 },
    { name: 'Keritot', pages: 27 },
    { name: 'Meilah', pages: 21 },
    { name: 'Niddah', pages: 72 }
  ]
};

/**
 * Mishnah Integration
 */
const MishnahStudy = {
  baseURL: 'https://www.sefaria.org/api',

  /**
   * Load Mishnah chapter
   */
  async loadChapter(tractate, chapter) {
    const reference = `Mishnah ${tractate}.${chapter}`;
    const url = `${this.baseURL}/texts/${encodeURIComponent(reference)}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      return {
        hebrew: data.he || [],
        english: data.text || [],
        reference: data.ref,
        commentary: await this.loadBartenura(tractate, chapter)
      };
    } catch (error) {
      console.error('Error loading Mishnah:', error);
      return null;
    }
  },

  /**
   * Load Bartenura commentary
   */
  async loadBartenura(tractate, chapter) {
    const reference = `Bartenura on Mishnah ${tractate}.${chapter}`;
    const url = `${this.baseURL}/texts/${encodeURIComponent(reference)}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      return {
        hebrew: data.he || [],
        english: data.text || []
      };
    } catch (error) {
      return null;
    }
  },

  /**
   * Mishnah orders (Sedarim)
   */
  orders: [
    {
      name: 'Zeraim',
      tractates: ['Berakhot', 'Peah', 'Demai', 'Kilayim', 'Sheviit', 'Terumot', 'Maasrot', 'Maaser Sheni', 'Challah', 'Orlah', 'Bikkurim']
    },
    {
      name: 'Moed',
      tractates: ['Shabbat', 'Eruvin', 'Pesachim', 'Shekalim', 'Yoma', 'Sukkah', 'Beitzah', 'Rosh Hashanah', 'Taanit', 'Megillah', 'Moed Katan', 'Chagigah']
    },
    {
      name: 'Nashim',
      tractates: ['Yevamot', 'Ketubot', 'Nedarim', 'Nazir', 'Sotah', 'Gittin', 'Kiddushin']
    },
    {
      name: 'Nezikin',
      tractates: ['Bava Kamma', 'Bava Metzia', 'Bava Batra', 'Sanhedrin', 'Makkot', 'Shevuot', 'Eduyot', 'Avodah Zarah', 'Avot', 'Horayot']
    },
    {
      name: 'Kodashim',
      tractates: ['Zevachim', 'Menachot', 'Chullin', 'Bekhorot', 'Arakhin', 'Temurah', 'Keritot', 'Meilah', 'Tamid', 'Middot', 'Kinnim']
    },
    {
      name: 'Tahorot',
      tractates: ['Keilim', 'Ohalot', 'Negaim', 'Parah', 'Tahorot', 'Mikvaot', 'Niddah', 'Makhshirin', 'Zavim', 'Tevul Yom', 'Yadayim', 'Uktzin']
    }
  ]
};

// Export
window.TalmudStudy = TalmudStudy;
window.MishnahStudy = MishnahStudy;
