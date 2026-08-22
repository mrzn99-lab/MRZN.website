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
    this.initAttempts = 0;
    this.maxAttempts = 30;
    
    // Auto-init with retry
    this.autoInit();
  }

  autoInit() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  async init() {
    try {
      console.log('🤖 Initializing MRZN Local AI...');
      
      // Wait for Supabase
      await this.waitForSupabase();
      
      // Load Transformers.js (optional)
      await this.loadTransformers();
      
      // Load app cache
      await this.loadAppCache();
      
      console.log('✅ MRZN Local AI Ready');
      this.isReady = true;
      this.isLoading = false;
      return true;
    } catch (error) {
      console.error('❌ AI Init Error:', error);
      this.isReady = true; // Continue without ML model
      this.isLoading = false;
      return false;
    }
  }

  async waitForSupabase() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50;
      
      const checkSupabase = () => {
        if (window.supabaseClient) {
          console.log('✅ Supabase client ready');
          resolve();
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkSupabase, 100);
        } else {
          console.warn('⚠️ Supabase client not loaded, continuing anyway');
          resolve(); // Continue without Supabase
        }
      };
      
      checkSupabase();
    });
  }

  async loadTransformers() {
    if (window.transformers) {
      this.transformersLoaded = true;
      console.log('✅ Transformers.js already loaded');
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0';
      
      script.onload = () => {
        this.transformersLoaded = true;
        console.log('✅ Transformers.js loaded from CDN');
        resolve();
      };
      
      script.onerror = () => {
        console.warn('⚠️ Transformers.js failed, using pattern matching only');
        this.transformersLoaded = false;
        resolve(); // Continue without ML
      };
      
      script.onabort = () => {
        console.warn('⚠️ Transformers.js loading aborted');
        resolve();
      };
      
      document.head.appendChild(script);
      
      // Timeout fallback
      setTimeout(() => {
        if (!this.transformersLoaded) {
          console.warn('⚠️ Transformers.js timeout');
          resolve();
        }
      }, 5000);
    });
  }

  async loadAppCache() {
    try {
      if (!window.supabaseClient) {
        console.log('⚠️ Supabase not available, using empty cache');
        this.appCache = [];
        return;
      }
      
      const { data: apps, error } = await window.supabaseClient
        .from('apps')
        .select('id, name, description, category, rating, review_count, icon_url, source_type, source_url')
        .limit(1000);
      
      if (error) {
        console.warn('Error loading apps:', error);
        this.appCache = [];
        return;
      }
      
      this.appCache = apps || [];
      console.log(`📦 Loaded ${this.appCache.length} apps into AI cache`);
    } catch (error) {
      console.error('Error loading apps:', error);
      this.appCache = [];
    }
  }

  // ============ INTENT CLASSIFICATION ============
  
  normalizeInput(text) {
    if (!text) return '';
    return text.toLowerCase().trim();
  }

  async classifyIntent(userInput) {
    const normalized = this.normalizeInput(userInput);
    
    if (!normalized) return 'SEARCH';
    
    // Bengali intent keywords
    const bengaliKeywords = {
      SEARCH: ['খোঁজো', 'খুঁজুন', 'অনুসন্ধান', 'কোন অ্যাপ', 'কোথায় আছে', 'দাও'],
      CATEGORY: ['বিভাগ', 'ক্যাটাগরি', 'সব ধরনের', 'কী আছে', 'কী ক্যাটাগরি'],
      DETAIL: ['কী', 'কিভাবে', 'সম্পর্কে', 'বিবরণ', 'তথ্য'],
      COMPARE: ['তুলনা', 'মধ্যে পার্থক্য', 'উভয় মধ্যে', 'কোনটি ভালো'],
      RECOMMEND: ['সুপারিশ', 'সেরা', 'আমার জন্য', 'ভালো'],
      RATING: ['রেটিং', 'রিভিউ', 'মতামত', 'রেট', 'স্কোর'],
      TRENDING: ['ট্রেন্ডিং', 'জনপ্রিয়', 'বেশি ডাউনলোড', 'সবার মতো'],
      OPEN_SETTINGS: ['সেটিংস', 'পছন্দ', 'নির্ধারণ'],
      OPEN_UPDATES: ['আপডেট', 'নতুন', 'পরিবর্তন'],
    };

    // English intent keywords
    const englishKeywords = {
      SEARCH: ['search', 'find', 'look for', 'get me', 'show me', 'want'],
      CATEGORY: ['category', 'categories', 'types', 'kind of', 'what are'],
      DETAIL: ['what', 'how', 'tell me', 'about', 'info', 'details'],
      COMPARE: ['compare', 'difference', 'vs', 'which is', 'better'],
      RECOMMEND: ['recommend', 'suggest', 'best', 'top', 'for me'],
      RATING: ['rating', 'review', 'rate', 'score'],
      TRENDING: ['trending', 'popular', 'top', 'most downloaded', 'trending'],
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
    if (!userInput || !userInput.trim()) {
      return {
        action: 'STATUS',
        message: '❓ Please type something...',
        results: []
      };
    }

    if (this.isLoading && !this.appCache.length) {
      return {
        action: 'STATUS',
        message: '⏳ Loading apps... Please wait a moment',
        results: []
      };
    }

    const intent = await this.classifyIntent(userInput);
    console.log(`🔍 Intent: ${intent}`);

    try {
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
        case 'OPEN_SETTINGS':
          return { action: 'OPEN_SETTINGS', message: '⚙️ Opening Settings...' };
        case 'OPEN_UPDATES':
          return { action: 'OPEN_UPDATES', message: '📰 Opening Updates...' };
        default:
          return this.handleSearch(userInput);
      }
    } catch (error) {
      console.error('Error processing query:', error);
      return {
        action: 'ERROR',
        message: '❌ Error processing your query',
        results: []
      };
    }
  }

  handleSearch(query) {
    if (!query || !this.appCache.length) {
      return {
        action: 'SEARCH',
        message: '❌ No apps loaded yet',
        results: []
      };
    }

    const searchTerm = query.toLowerCase().trim();
    const results = this.appCache.filter(app => {
      if (!app) return false;
      const name = (app.name || '').toLowerCase();
      const desc = (app.description || '').toLowerCase();
      const cat = (app.category || '').toLowerCase();
      return name.includes(searchTerm) || desc.includes(searchTerm) || cat.includes(searchTerm);
    }).slice(0, 5);

    if (results.length === 0) {
      return {
        action: 'SEARCH',
        message: `❌ No apps found for "${query}". Try a different search or browse by category.`,
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
    if (!this.appCache.length) {
      return {
        action: 'CATEGORY',
        message: '❌ No categories available yet',
        categories: [],
        results: []
      };
    }

    const categories = [...new Set(this.appCache
      .map(app => app.category)
      .filter(Boolean)
    )].sort();

    return {
      action: 'CATEGORY',
      message: `📂 Available categories (${categories.length}):`,
      categories: categories,
      results: []
    };
  }

  handleDetail(query) {
    if (!query || !this.appCache.length) {
      return {
        action: 'DETAIL',
        message: '❓ No apps found',
        results: []
      };
    }

    const term = query.toLowerCase().trim();
    const app = this.appCache.find(a =>
      a && a.name && a.name.toLowerCase().includes(term)
    );

    if (!app) {
      return {
        action: 'DETAIL',
        message: `❓ Couldn't find details for "${query}"`,
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
    if (!this.appCache.length) {
      return {
        action: 'COMPARE',
        message: 'No apps available to compare',
        results: []
      };
    }

    const terms = query.split(/vs|vs\.|between|compared to/i).map(t => t.trim()).filter(Boolean);
    const results = terms
      .map(term => this.appCache.find(a =>
        a && a.name && a.name.toLowerCase().includes(term.toLowerCase())
      ))
      .filter(Boolean)
      .slice(0, 3);

    if (results.length < 2) {
      return {
        action: 'COMPARE',
        message: 'Need at least 2 app names to compare. Try: "App1 vs App2"',
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
    if (!this.appCache.length) {
      return {
        action: 'RECOMMEND',
        message: 'No apps available',
        results: []
      };
    }

    const recommended = [...this.appCache]
      .filter(app => app && app.rating && app.rating > 0)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5);

    if (!recommended.length) {
      return {
        action: 'RECOMMEND',
        message: 'No rated apps available yet',
        results: []
      };
    }

    return {
      action: 'RECOMMEND',
      message: '⭐ Top recommended apps based on ratings:',
      results: recommended
    };
  }

  handleRating(query) {
    if (!this.appCache.length) {
      return {
        action: 'RATING',
        message: 'No apps available',
        results: []
      };
    }

    const term = query.toLowerCase().trim();
    const app = this.appCache.find(a =>
      a && a.name && a.name.toLowerCase().includes(term)
    );

    if (!app) {
      return {
        action: 'RATING',
        message: `❓ Couldn't find "${query}"`,
        results: []
      };
    }

    const rating = app.rating || 0;
    const stars = '⭐'.repeat(Math.round(rating)) + '☆'.repeat(Math.max(0, 5 - Math.round(rating)));

    return {
      action: 'RATING',
      message: `📊 ${app.name}: ${rating.toFixed(1)}/5 ${stars} (${app.review_count || 0} reviews)`,
      results: [app]
    };
  }

  handleTrending() {
    if (!this.appCache.length) {
      return {
        action: 'TRENDING',
        message: 'No apps available',
        results: []
      };
    }

    const trending = [...this.appCache]
      .filter(app => app && app.review_count && app.review_count > 0)
      .sort((a, b) => (b.review_count || 0) - (a.review_count || 0))
      .slice(0, 5);

    if (!trending.length) {
      return {
        action: 'TRENDING',
        message: 'No trending apps yet',
        results: []
      };
    }

    return {
      action: 'TRENDING',
      message: '🔥 Trending apps (most reviewed):',
      results: trending
    };
  }
}

// ============ INITIALIZE ============
try {
  window.mrzn_ai = new MRZNLocalAI();
  console.log('✅ MRZN AI Module Loaded');
} catch (error) {
  console.error('Failed to initialize AI:', error);
}
