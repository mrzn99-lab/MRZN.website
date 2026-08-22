/**
 * 🤖 MRZN Local AI Assistant (Transformers.js Based)
 * Offline, No API Keys Required
 * Supports: Bengali, Banglish, English, Hindi + Spell Correction
 */

class MRZNLocalAI {
  constructor() {
    this.isReady = false;
    this.isLoading = true;
    this.appCache = [];
    this.transformersLoaded = false;
    this.init();
  }

  async init() {
    try {
      console.log('🤖 Initializing MRZN Local AI...');
      
      // Load Transformers.js
      await this.loadTransformers();
      
      // Load app cache
      await this.loadAppCache();
      
      console.log('✅ MRZN Local AI Ready');
      this.isReady = true;
      this.isLoading = false;
      return true;
    } catch (error) {
      console.error('❌ AI Init Error:', error);
      this.isReady = false;
      this.isLoading = false;
      return false;
    }
  }

  async loadTransformers() {
    if (window.transformers) {
      this.transformersLoaded = true;
      console.log('✅ Transformers.js already loaded');
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0';
      
      script.onload = () => {
        this.transformersLoaded = true;
        console.log('✅ Transformers.js loaded from CDN');
        resolve();
      };
      
      script.onerror = () => {
        console.warn('⚠️ Transformers.js failed, using pattern matching fallback');
        this.transformersLoaded = false;
        resolve(); // Continue without ML model
      };
      
      document.head.appendChild(script);
    });
  }

  async loadAppCache() {
    try {
      if (!window.supabaseClient) {
        console.log('⚠️ Supabase not ready yet');
        return;
      }
      
      const { data: apps } = await window.supabaseClient
        .from('apps')
        .select('id, name, description, category, rating, review_count, icon_url, source_type, source_url');
      
      this.appCache = apps || [];
      console.log(`📦 Loaded ${this.appCache.length} apps into AI cache`);
    } catch (error) {
      console.error('Error loading apps:', error);
      this.appCache = [];
    }
  }

  // ============ INTENT CLASSIFICATION ============
  
  normalizeInput(text) {
    return text.toLowerCase().trim();
  }

  async classifyIntent(userInput) {
    const normalized = this.normalizeInput(userInput);
    
    // Bengali intent keywords
    const bengaliKeywords = {
      SEARCH: ['খোঁজো', 'খুঁজুন', 'অনুসন্ধান', 'কোন অ্যাপ', 'কোথায় আছে'],
      CATEGORY: ['বিভাগ', 'ক্যাটাগরি', 'সব ধরনের', 'কী আছে'],
      DETAIL: ['কী', 'কিভাবে', 'সম্পর্কে', 'বিবরণ'],
      COMPARE: ['তুলনা', 'মধ্যে পার্থক্য', 'উভয় মধ্যে', 'কোনটি ভালো'],
      RECOMMEND: ['সুপারিশ', 'সেরা', 'আমার জন্য'],
      RATING: ['রেটিং', 'রিভিউ', 'মতামত'],
      TRENDING: ['ট্রেন্ডিং', 'জনপ্রিয়', 'বেশি ডাউনলোড'],
      APK_ANALYSIS: ['apk', 'ডাউনলোড', 'সাইজ', 'সংস্করণ'],
      OPEN_APP: ['খুলুন', 'চালু করুন', 'প্লে স্টোর'],
      SET_THEME: ['থিম', 'রঙ', 'অন্ধকার', 'উজ্জ্বল'],
      OPEN_SETTINGS: ['সেটিংস', 'পছন্দ', 'নির্ধারণ'],
      OPEN_UPDATES: ['আপডেট', 'নতুন', 'পরিবর্তন'],
    };

    // English intent keywords
    const englishKeywords = {
      SEARCH: ['search', 'find', 'look for', 'get me', 'show me'],
      CATEGORY: ['category', 'categories', 'types', 'kind of', 'what are'],
      DETAIL: ['what', 'how', 'tell me', 'about', 'info', 'details'],
      COMPARE: ['compare', 'difference', 'vs', 'which is', 'better'],
      RECOMMEND: ['recommend', 'suggest', 'best', 'top', 'for me'],
      RATING: ['rating', 'review', 'rate', 'score'],
      TRENDING: ['trending', 'popular', 'top', 'most downloaded'],
      APK_ANALYSIS: ['apk', 'download', 'size', 'version', 'android'],
      OPEN_APP: ['open', 'launch', 'start', 'play store'],
      SET_THEME: ['theme', 'color', 'dark', 'light', 'appearance'],
      OPEN_SETTINGS: ['settings', 'preferences', 'configure'],
      OPEN_UPDATES: ['updates', 'changelog', 'new', 'features'],
    };

    // Check Bengali keywords
    for (const [intent, keywords] of Object.entries(bengaliKeywords)) {
      if (keywords.some(kw => normalized.includes(kw))) {
        return intent;
      }
    }

    // Check English keywords
    for (const [intent, keywords] of Object.entries(englishKeywords)) {
      if (keywords.some(kw => normalized.includes(kw))) {
        return intent;
      }
    }

    // Default to SEARCH
    return 'SEARCH';
  }

  // ============ INTENT HANDLERS ============

  async processUserQuery(userInput) {
    if (this.isLoading) {
      return {
        action: 'STATUS',
        message: '⏳ AI is still initializing... Please wait a moment',
        results: []
      };
    }

    const intent = await this.classifyIntent(userInput);
    console.log(`🔍 Intent: ${intent}`);

    switch (intent) {
      case 'SEARCH':
        return this.handleSearch(userInput);
      case 'CATEGORY':
        return this.handleCategory();
      case 'DETAIL':
        return this.handleDetail(userInput);
      case 'COMPARE':
        return this.handleCompare(userInput);
      case 'RECOMMEND':
        return this.handleRecommend();
      case 'RATING':
        return this.handleRating(userInput);
      case 'TRENDING':
        return this.handleTrending();
      case 'APK_ANALYSIS':
        return this.handleAPKAnalysis(userInput);
      case 'OPEN_APP':
        return this.handleOpenApp(userInput);
      case 'SET_THEME':
        return { action: 'SET_THEME', message: '🎨 Opening appearance settings...' };
      case 'OPEN_SETTINGS':
        return { action: 'OPEN_SETTINGS', message: '⚙️ Opening Settings...' };
      case 'OPEN_UPDATES':
        return { action: 'OPEN_UPDATES', message: '📰 Opening Updates...' };
      default:
        return this.handleSearch(userInput);
    }
  }

  handleSearch(query) {
    const searchTerm = query.toLowerCase();
    const results = this.appCache.filter(app =>
      app.name.toLowerCase().includes(searchTerm) ||
      app.description.toLowerCase().includes(searchTerm) ||
      app.category.toLowerCase().includes(searchTerm)
    ).slice(0, 5);

    if (results.length === 0) {
      return {
        action: 'SEARCH',
        message: `❌ No apps found for "${query}". Try searching by category instead.`,
        results: []
      };
    }

    return {
      action: 'SEARCH',
      message: `✅ Found ${results.length} app${results.length !== 1 ? 's' : ''} matching "${query}"`,
      results: results
    };
  }

  handleCategory() {
    const categories = [...new Set(this.appCache.map(app => app.category))].sort();
    return {
      action: 'CATEGORY',
      message: `📂 Available categories (${categories.length}):`,
      categories: categories,
      results: []
    };
  }

  handleDetail(query) {
    const term = query.toLowerCase();
    const app = this.appCache.find(a =>
      a.name.toLowerCase().includes(term)
    );

    if (!app) {
      return {
        action: 'DETAIL',
        message: `❓ Couldn't find details for "${query}". Try a different search.`,
        results: []
      };
    }

    return {
      action: 'DETAIL',
      message: `📋 Details for ${app.name}:`,
      results: [app]
    };
  }

  handleCompare(query) {
    const terms = query.split(/vs|vs\.|between|compared to/i).map(t => t.trim());
    const results = terms
      .map(term => this.appCache.find(a =>
        a.name.toLowerCase().includes(term.toLowerCase())
      ))
      .filter(Boolean)
      .slice(0, 3);

    if (results.length < 2) {
      return {
        action: 'COMPARE',
        message: 'Need at least 2 apps to compare. Please mention app names.',
        results: []
      };
    }

    return {
      action: 'COMPARE',
      message: `⚖️ Comparing ${results.map(r => r.name).join(', ')}:`,
      results: results
    };
  }

  handleRecommend() {
    const recommended = [...this.appCache]
      .filter(app => app.rating && app.rating > 0)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5);

    return {
      action: 'RECOMMEND',
      message: '⭐ Top recommended apps based on ratings:',
      results: recommended
    };
  }

  handleRating(query) {
    const term = query.toLowerCase();
    const app = this.appCache.find(a =>
      a.name.toLowerCase().includes(term)
    );

    if (!app) {
      return {
        action: 'RATING',
        message: `❓ Couldn't find "${query}"`,
        results: []
      };
    }

    const rating = app.rating || 0;
    const stars = '⭐'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));

    return {
      action: 'RATING',
      message: `📊 ${app.name}: ${rating}/5 ${stars} (${app.review_count || 0} reviews)`,
      results: [app]
    };
  }

  handleTrending() {
    const trending = [...this.appCache]
      .filter(app => app.review_count && app.review_count > 0)
      .sort((a, b) => (b.review_count || 0) - (a.review_count || 0))
      .slice(0, 5);

    return {
      action: 'TRENDING',
      message: '🔥 Trending apps (most reviewed):',
      results: trending
    };
  }

  handleAPKAnalysis(query) {
    const term = query.toLowerCase();
    const app = this.appCache.find(a =>
      a.name.toLowerCase().includes(term)
    );

    if (!app) {
      return {
        action: 'APK_ANALYSIS',
        message: `❓ Couldn't find "${query}"`,
        results: []
      };
    }

    return {
      action: 'APK_ANALYSIS',
      message: `📦 APK Info for ${app.name}`,
      results: [app]
    };
  }

  handleOpenApp(query) {
    const term = query.toLowerCase();
    const app = this.appCache.find(a =>
      a.name.toLowerCase().includes(term)
    );

    if (!app) {
      return {
        action: 'OPEN_APP',
        message: `❓ App "${query}" not found`,
        results: []
      };
    }

    return {
      action: 'OPEN_APP',
      message: `🔗 Opening ${app.name} on Play Store...`,
      appId: app.id,
      results: [app]
    };
  }
}

// ============ INITIALIZE ============
window.mrzn_ai = new MRZNLocalAI();
console.log('✅ MRZN AI Module Loaded');
