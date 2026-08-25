/**
 * 🤖 General AI - Offline + Language Support
 * Pattern Matching + Database + Multi-Language
 */

class GeneralAI {
  constructor() {
    this.appCache = [];
    this.history = [];
    this.isReady = false;
    this.init();
  }

  async init() {
    try {
      console.log('🤖 Initializing Offline AI with Language Support...');
      await this.waitForDB();
      await this.loadAppData();
      this.setupPatterns();
      this.isReady = true;
      console.log('✅ AI Ready - Multilingual Support');
    } catch (err) {
      console.error('AI init:', err);
      this.isReady = true;
    }
  }

  async waitForDB() {
    return new Promise((resolve) => {
      let tries = 0;
      const check = () => {
        if (window.supabaseClient) {
          console.log('✅ Database ready');
          resolve();
        } else if (tries < 50) {
          tries++;
          setTimeout(check, 100);
        } else {
          console.warn('⚠️ Offline mode');
          resolve();
        }
      };
      check();
    });
  }

  async loadAppData() {
    try {
      if (!window.supabaseClient) {
        console.warn('Offline - no database');
        return;
      }

      const { data: apps, error } = await window.supabaseClient
        .from('apps')
        .select('*')
        .limit(1000);

      this.appCache = apps || [];
      console.log('✅ Loaded ' + this.appCache.length + ' apps');
    } catch (err) {
      console.error('Data error:', err);
      this.appCache = [];
    }
  }

  // ============ LANGUAGE SUPPORT ============

  getCurrentLanguage() {
    return window.languageManager?.currentLang || localStorage.getItem('mrzn_language') || 'en';
  }

  async translateResponse(text, targetLang) {
    if (!text || targetLang === 'en') return text;

    try {
      const encodedText = encodeURIComponent(text);
      const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|${targetLang}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.responseStatus === 200) {
        return data.responseData.translatedText;
      }
      return text;
    } catch (err) {
      console.warn('Translation error:', err);
      return text;
    }
  }

  // ============ PATTERNS & RULES ============

  setupPatterns() {
    this.patterns = {
      greeting: /hello|hi|hey|নমস্কার|হ্যালো|হাই|কীভাবে|কি খবর|কিমন/i,
      farewell: /bye|goodbye|বিদায়|খোদা|আল্লাহ|দেখা হবে/i,
      thanks: /thanks|thank you|ধন্যবাদ|শুকরিয়া|মাশাল্লাহ/i,
      search: /search|find|খোঁজো|খুঁজুন|দাও|বলো/i,
      details: /details|about|info|inform|describe|বলো|কিভাবে|কী|সম্পর্কে/i,
      compare: /compare|vs|versus|কোনটা/i,
      rating: /rating|rate|review|রেটিং|রিভিউ|মতামত/i,
      best: /best|top|good|ভাল|সেরা|দারুণ|excellent/i,
      trending: /trending|popular|ট্রেন্ডিং|জনপ্রিয়/i,
      help: /help|command|কমান্ড|সাহায্য|কি করতে|কীভাবে ব্যবহার/i,
      category: /categor|type|ধরন|বিভাগ|ক্যাটাগরি/i,
    };
  }

  // ============ UTILITIES ============

  levenshtein(a, b) {
    if (!a || !b) return 99;
    a = String(a).toLowerCase();
    b = String(b).toLowerCase();
    const m = a.length, n = b.length;
    const d = Array(m+1).fill(null).map(() => Array(n+1).fill(0));
    
    for (let i = 0; i <= m; i++) d[i][0] = i;
    for (let j = 0; j <= n; j++) d[0][j] = j;
    
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i-1] === b[j-1]) {
          d[i][j] = d[i-1][j-1];
        } else {
          d[i][j] = 1 + Math.min(d[i-1][j], d[i][j-1], d[i-1][j-1]);
        }
      }
    }
    return d[m][n];
  }

  findApp(query) {
    if (!query || this.appCache.length === 0) return null;
    
    const q = String(query).toLowerCase();
    
    let app = this.appCache.find(a => a?.name?.toLowerCase() === q);
    if (app) return app;
    
    app = this.appCache.find(a =>
      a?.name?.toLowerCase().includes(q) ||
      a?.description?.toLowerCase().includes(q)
    );
    if (app) return app;
    
    let best = null, minDist = 3;
    this.appCache.forEach(a => {
      const dist = this.levenshtein(q, a?.name);
      if (dist < minDist) {
        minDist = dist;
        best = a;
      }
    });
    
    return best;
  }

  searchApps(query) {
    if (!query || this.appCache.length === 0) return [];
    
    const q = String(query).toLowerCase();
    return this.appCache.filter(a =>
      a?.name?.toLowerCase().includes(q) ||
      a?.description?.toLowerCase().includes(q) ||
      a?.category?.toLowerCase().includes(q)
    ).slice(0, 5);
  }

  getTopApps(limit = 5) {
    return [...this.appCache]
      .filter(a => a?.rating)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, limit);
  }

  getTrendingApps(limit = 5) {
    return [...this.appCache]
      .filter(a => a?.review_count)
      .sort((a, b) => (b.review_count || 0) - (a.review_count || 0))
      .slice(0, limit);
  }

  // ============ RESPONSE GENERATORS ============

  generateGreeting() {
    const greetings = [
      '👋 Hello! How can I help you?',
      '😊 Hi there! What do you need?',
      '🙏 Namaste! Ask me anything!',
      '👋 হ্যালো! কি চাই?',
      '😊 নমস্কার! বলো কি সাহায্য করব?',
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  generateThankYou() {
    const responses = [
      '😊 You\'re welcome!',
      '✨ Happy to help!',
      '👍 Anytime!',
      '😊 স্বাগতম!',
      '✨ আনন্দিত!',
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  generateHelp() {
    return `🤖 MRZN AI - Offline & Unlimited
━━━━━━━━━━━━━━━━━━━━━━
✅ No API keys needed
✅ Fully offline
✅ আনলিমিটেড উত্তর

📱 COMMANDS:
  search [app]
  details [app]
  best apps
  trending
  rating [app]
  categories
  compare [app1] vs [app2]

💬 CHAT:
  Just ask anything!
  Ask in Bengali or English

🎯 EXAMPLES:
  "find Termux"
  "details AIDE"
  "hello"
  "Termux vs AIDE"`;
  }

  generateGeneral(input) {
    const responses = [
      'I\'m MRZN AI. I can help you find apps! 📱',
      'Ask me about apps or chat about anything! 😊',
      'I\'m here to help! Type "help" for commands.',
      'আমি MRZN AI। আপনি কি চাইছেন? 🤖',
      'অ্যাপ খুঁজতে চান? নাকি কিছু জিজ্ঞাসা করবেন? 📱',
      'আমি এখানে আছি! কি সাহায্য করব? 😊',
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // ============ MAIN PROCESSOR ============

  async processUserQuery(input) {
    try {
      if (!input || !String(input).trim()) {
        return '😊 Please ask something or type "help"';
      }

      const msg = String(input).toLowerCase();
      this.history.push({ role: 'user', content: input });

      let response = '';

      // GREETING
      if (this.patterns.greeting.test(msg)) {
        response = this.generateGreeting();
      }

      // THANKS
      else if (this.patterns.thanks.test(msg)) {
        response = this.generateThankYou();
      }

      // HELP
      else if (this.patterns.help.test(msg)) {
        response = this.generateHelp();
      }

      // SEARCH APP
      else if (this.patterns.search.test(msg)) {
        const terms = String(input).split(/\s+/).filter(w => 
          !['search', 'find', 'খোঁজো', 'খুঁজুন', 'দাও', 'app', 'apps'].includes(w.toLowerCase())
        );
        const query = terms.join(' ') || String(input).replace(/search|find|খোঁজো|খুঁজুন|দাও/gi, '').trim();
        
        if (query && this.appCache.length > 0) {
          const results = this.searchApps(query);
          
          if (results.length > 0) {
            response = '✅ Found ' + results.length + ' app(s):\n\n';
            results.forEach((a, i) => {
              response += (i+1) + '. ' + a.name + ' ⭐' + (a.rating?.toFixed(1) || '?') + '/5\n';
            });
            response += '\n📝 Type "details [app]" for more';
          } else {
            response = '❌ No apps found for "' + query + '"';
          }
        } else if (!query) {
          response = '🔍 What app are you looking for?';
        } else {
          response = '⚠️ Database not ready. Try again!';
        }
      }

      // DETAILS
      else if (this.patterns.details.test(msg)) {
        const name = String(input).replace(/details|about|info|বলো|কিভাবে|কী|সম্পর্কে/gi, '').trim();
        
        if (name && this.appCache.length > 0) {
          const app = this.findApp(name);
          
          if (app) {
            response = '📱 ' + app.name + '\n';
            response += '━━━━━━━━━\n';
            response += '⭐ ' + (app.rating?.toFixed(1) || 'N/A') + '/5\n';
            response += '👥 ' + (app.review_count || 0) + ' reviews\n';
            response += '📂 ' + (app.category || 'N/A') + '\n';
            response += '📝 ' + (app.description?.substring(0, 150) || 'No description');
          } else {
            response = '❌ App "' + name + '" not found';
          }
        } else {
          response = '📱 Which app? Example: "details Termux"';
        }
      }

      // COMPARE
      else if (this.patterns.compare.test(msg)) {
        const parts = String(input).split(/\svs\s|vs\s|vs/i);
        
        if (parts.length >= 2 && this.appCache.length > 0) {
          const app1 = this.findApp(parts[0]);
          const app2 = this.findApp(parts[1]);
          
          if (app1 && app2) {
            response = '⚖️ ' + app1.name + ' vs ' + app2.name + '\n';
            response += '━━━━━━━━━━━━━━\n';
            response += '⭐ ' + (app1.rating?.toFixed(1) || '?') + ' vs ' + (app2.rating?.toFixed(1) || '?') + '\n';
            response += '👥 ' + (app1.review_count || 0) + ' vs ' + (app2.review_count || 0) + ' reviews\n';
            
            if ((app1.rating || 0) > (app2.rating || 0)) {
              response += '\n🏆 ' + app1.name + ' wins!';
            } else if ((app2.rating || 0) > (app1.rating || 0)) {
              response += '\n🏆 ' + app2.name + ' wins!';
            } else {
              response += '\n🤝 It\'s a tie!';
            }
          } else {
            response = '❌ Could not find both apps';
          }
        } else {
          response = '⚖️ Usage: "compare [app1] vs [app2]"';
        }
      }

      // BEST
      else if (this.patterns.best.test(msg)) {
        if (this.appCache.length > 0) {
          const topApps = this.getTopApps(5);
          
          if (topApps.length > 0) {
            response = '⭐ Top Rated Apps:\n\n';
            topApps.forEach((a, i) => {
              response += (i+1) + '. ' + a.name + ' (' + a.rating.toFixed(1) + '/5)\n';
            });
          } else {
            response = '📱 No rated apps yet';
          }
        }
      }

      // TRENDING
      else if (this.patterns.trending.test(msg)) {
        if (this.appCache.length > 0) {
          const trending = this.getTrendingApps(5);
          
          if (trending.length > 0) {
            response = '🔥 Trending Apps:\n\n';
            trending.forEach((a, i) => {
              response += (i+1) + '. ' + a.name + ' (' + (a.review_count || 0) + ' reviews)\n';
            });
          } else {
            response = '📱 No apps yet';
          }
        }
      }

      // RATING
      else if (this.patterns.rating.test(msg)) {
        const name = String(input).replace(/rating|rate|review|রেটিং|রিভিউ|মতামত/gi, '').trim();
        
        if (name && this.appCache.length > 0) {
          const app = this.findApp(name);
          
          if (app) {
            const stars = '⭐'.repeat(Math.round(app.rating || 0)) + '☆'.repeat(Math.max(0, 5 - Math.round(app.rating || 0)));
            response = '📊 ' + app.name + '\n' + (app.rating?.toFixed(1) || '?') + '/5 ' + stars + '\n👥 ' + (app.review_count || 0) + ' reviews';
          } else {
            response = '❌ App not found';
          }
        }
      }

      // CATEGORIES
      else if (this.patterns.category.test(msg)) {
        if (this.appCache.length > 0) {
          const cats = [...new Set(this.appCache.map(a => a?.category).filter(Boolean))].sort();
          response = '📂 Categories:\n' + cats.slice(0, 10).join(', ');
        }
      }

      // DEFAULT
      else {
        response = this.generateGeneral(input);
      }

      // Translate response to user's language
      const userLang = this.getCurrentLanguage();
      if (userLang !== 'en' && response) {
        response = await this.translateResponse(response, userLang);
      }

      this.history.push({ role: 'assistant', content: response });
      if (this.history.length > 50) this.history = this.history.slice(-50);

      return response;
    } catch (error) {
      console.error('Process error:', error);
      return 'I\'m here to help! Ask me about apps. 😊';
    }
  }
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.generalAI = new GeneralAI();
  });
} else {
  window.generalAI = new GeneralAI();
}
