/**
 * 🤖 MRZN Ollama-Style AI
 * Comprehensive conversational AI with unlimited question handling
 * Supports: Bengali, Banglish, English, Typo correction
 */

class OllamaAI {
  constructor() {
    this.appCache = [];
    this.conversationHistory = [];
    this.isReady = false;
    this.init();
  }

  async init() {
    try {
      console.log('🤖 Initializing Ollama AI...');
      await this.waitForSupabase();
      await this.loadAppCache();
      this.isReady = true;
      console.log('✅ Ollama AI Ready');
    } catch (error) {
      console.error('AI init error:', error);
      this.isReady = true; // Continue anyway
    }
  }

  async waitForSupabase() {
    return new Promise((resolve) => {
      let attempts = 0;
      const check = () => {
        if (window.supabaseClient) {
          console.log('✅ Supabase ready');
          resolve();
        } else if (attempts < 50) {
          attempts++;
          setTimeout(check, 100);
        } else {
          console.warn('Supabase timeout');
          resolve();
        }
      };
      check();
    });
  }

  async loadAppCache() {
    try {
      if (!window.supabaseClient) return;

      const { data } = await window.supabaseClient
        .from('apps')
        .select('id, name, description, category, rating, review_count, icon_url, downloads, size, permissions');

      this.appCache = data || [];
      console.log('📦 Loaded ' + this.appCache.length + ' apps');
    } catch (error) {
      console.error('Load error:', error);
      this.appCache = [];
    }
  }

  // ============ TYPO CORRECTION ============

  levenshteinDistance(a, b) {
    const m = a.length;
    const n = b.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }

    return dp[m][n];
  }

  findClosestMatch(query, options, threshold = 3) {
    let closest = null;
    let minDistance = threshold;

    options.forEach(option => {
      const distance = this.levenshteinDistance(query.toLowerCase(), option.toLowerCase());
      if (distance < minDistance) {
        minDistance = distance;
        closest = option;
      }
    });

    return closest;
  }

  // ============ INTENT CLASSIFICATION ============

  classifyIntent(userInput) {
    const msg = userInput.toLowerCase().trim();

    // Bengali keywords
    const bengaliIntents = {
      'search': ['খোঁজো', 'খুঁজুন', 'অ্যাপ দাও', 'কোন অ্যাপ', 'কোথায়'],
      'details': ['বিবরণ', 'সম্পর্কে', 'তথ্য', 'কী আছে'],
      'compare': ['তুলনা', 'মধ্যে পার্থক্য', 'কোনটি ভালো', 'vs'],
      'recommend': ['সুপারিশ করো', 'সেরা', 'ভালো', 'আমার জন্য কী'],
      'rating': ['রেটিং', 'রিভিউ', 'মতামত', 'কত স্টার'],
      'permissions': ['অনুমতি', 'নিরাপত্তা', 'ডেটা', 'প্রাইভেসি'],
      'trending': ['ট্রেন্ডিং', 'জনপ্রিয়', 'বেশি ডাউনলোড', 'নতুন'],
      'updates': ['আপডেট', 'নতুন ফিচার', 'পরিবর্তন', 'সংস্করণ'],
      'help': ['সাহায্য', 'কিভাবে', 'কী করবো', 'জানাও'],
    };

    // English keywords
    const englishIntents = {
      'search': ['search', 'find', 'show me', 'get', 'app'],
      'details': ['details', 'about', 'info', 'tell me'],
      'compare': ['compare', 'difference', 'vs', 'better'],
      'recommend': ['recommend', 'suggest', 'best', 'good'],
      'rating': ['rating', 'review', 'rate', 'score'],
      'permissions': ['permission', 'security', 'privacy', 'data'],
      'trending': ['trending', 'popular', 'top', 'most'],
      'updates': ['update', 'new', 'feature', 'version'],
      'help': ['help', 'how', 'what', 'tell'],
    };

    // Check Bengali
    for (const [intent, keywords] of Object.entries(bengaliIntents)) {
      if (keywords.some(kw => msg.includes(kw))) return intent;
    }

    // Check English
    for (const [intent, keywords] of Object.entries(englishIntents)) {
      if (keywords.some(kw => msg.includes(kw))) return intent;
    }

    // Default to general Q&A
    return 'general';
  }

  // ============ INTENT HANDLERS ============

  async processUserQuery(userInput) {
    try {
      if (!userInput || !userInput.trim()) {
        return 'Please ask something or type "help"';
      }

      // Add to history
      this.conversationHistory.push({ role: 'user', content: userInput });

      const intent = this.classifyIntent(userInput);
      console.log('🔍 Intent:', intent);

      let response = '';

      switch (intent) {
        case 'search':
          response = this.handleSearch(userInput);
          break;
        case 'details':
          response = this.handleDetails(userInput);
          break;
        case 'compare':
          response = this.handleCompare(userInput);
          break;
        case 'recommend':
          response = this.handleRecommend();
          break;
        case 'rating':
          response = this.handleRating(userInput);
          break;
        case 'permissions':
          response = this.handlePermissions(userInput);
          break;
        case 'trending':
          response = this.handleTrending();
          break;
        case 'updates':
          response = await this.handleUpdates();
          break;
        case 'help':
          response = this.getHelp();
          break;
        default:
          response = this.handleGeneralQA(userInput);
      }

      // Add to history
      this.conversationHistory.push({ role: 'assistant', content: response });

      // Keep last 20 messages
      if (this.conversationHistory.length > 40) {
        this.conversationHistory = this.conversationHistory.slice(-40);
      }

      return response;
    } catch (error) {
      console.error('Query error:', error);
      return '❌ Error processing query. Try again.';
    }
  }

  handleSearch(query) {
    // Extract search term
    const words = query.toLowerCase().split(/\s+/);
    const searchWords = words.filter(w => 
      !['find', 'search', 'app', 'খোঁজো', 'খুঁজুন', 'দাও'].includes(w)
    );
    const searchTerm = searchWords.join(' ');

    if (!searchTerm) {
      return '🔍 What app are you looking for?';
    }

    const results = this.appCache.filter(app => {
      const name = (app.name || '').toLowerCase();
      const desc = (app.description || '').toLowerCase();
      const cat = (app.category || '').toLowerCase();

      // Exact match or typo-tolerant match
      if (name.includes(searchTerm)) return true;
      if (desc.includes(searchTerm)) return true;
      if (cat.includes(searchTerm)) return true;

      // Typo tolerance
      const distance = this.levenshteinDistance(searchTerm, name);
      return distance <= 2;
    }).slice(0, 5);

    if (results.length === 0) {
      // Try to find close match
      const appNames = this.appCache.map(a => a.name);
      const closest = this.findClosestMatch(searchTerm, appNames);
      
      if (closest) {
        return '😊 Did you mean "' + closest + '"?\n' +
          '📝 Type: "details ' + closest + '" to learn more';
      }

      return '❌ No apps found for "' + searchTerm + '"\n' +
        '💡 Try searching by category or use "categories" command';
    }

    let response = '✅ Found ' + results.length + ' app(s):\n\n';
    results.forEach((app, i) => {
      response += (i + 1) + '. 📱 ' + app.name + '\n';
      response += '   ⭐ ' + (app.rating || 'N/A') + '/5 (' + (app.review_count || 0) + ' reviews)\n';
      response += '   📂 ' + (app.category || 'N/A') + '\n';
      response += '   📝 ' + (app.description.substring(0, 50) || 'N/A') + '...\n\n';
    });

    response += '💡 Tip: Type "details [app name]" for full info\n';
    response += '⚖️ Type "compare [app1] vs [app2]" to compare';

    return response;
  }

  handleDetails(query) {
    const words = query.toLowerCase().split(/\s+/).slice(1); // Skip "details"
    const appName = words.join(' ');

    if (!appName) {
      return '📱 Which app? Type: "details [app name]"';
    }

    const app = this.appCache.find(a =>
      a.name.toLowerCase().includes(appName) ||
      this.levenshteinDistance(appName, a.name.toLowerCase()) <= 2
    );

    if (!app) {
      return '❌ App not found. Try "search ' + appName + '"';
    }

    let response = '📱 ' + app.name + '\n';
    response += '━━━━━━━━━━━━━━━━━\n';
    response += '⭐ Rating: ' + (app.rating || 'N/A') + '/5\n';
    response += '👥 Reviews: ' + (app.review_count || 0) + '\n';
    response += '📂 Category: ' + (app.category || 'N/A') + '\n';
    response += '📥 Downloads: ' + (app.downloads || 'N/A') + '\n';
    response += '📦 Size: ' + (app.size || 'N/A') + '\n';
    response += '📝 Description:\n' + (app.description || 'N/A') + '\n\n';

    if (app.permissions) {
      response += '🔐 Key Permissions:\n' + app.permissions + '\n\n';
    }

    response += '🔗 View on Play Store: app.html?id=' + app.id + '\n';
    response += '💬 Type "rating ' + app.name + '" for reviews';

    return response;
  }

  handleCompare(query) {
    // Extract app names from "compare X vs Y"
    const parts = query.toLowerCase().split(/\svs\s|vs\.|vs|মধ্যে|তুলনা/);
    const app1Name = parts[0].replace(/compare|তুলনা/gi, '').trim();
    const app2Name = parts[1]?.trim();

    if (!app1Name || !app2Name) {
      return '⚖️ Usage: "compare [app1] vs [app2]"';
    }

    const app1 = this.appCache.find(a => a.name.toLowerCase().includes(app1Name));
    const app2 = this.appCache.find(a => a.name.toLowerCase().includes(app2Name));

    if (!app1 || !app2) {
      return '❌ Could not find both apps. Check spelling.';
    }

    let response = '⚖️ ' + app1.name + ' vs ' + app2.name + '\n';
    response += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
    response += '📊 Rating:\n';
    response += '  ' + app1.name + ': ⭐ ' + (app1.rating || 'N/A') + '/5\n';
    response += '  ' + app2.name + ': ⭐ ' + (app2.rating || 'N/A') + '/5\n\n';
    response += '👥 Reviews:\n';
    response += '  ' + app1.name + ': ' + (app1.review_count || 0) + '\n';
    response += '  ' + app2.name + ': ' + (app2.review_count || 0) + '\n\n';
    response += '📂 Category:\n';
    response += '  ' + app1.name + ': ' + (app1.category || 'N/A') + '\n';
    response += '  ' + app2.name + ': ' + (app2.category || 'N/A') + '\n\n';
    response += '📝 Description:\n';
    response += '  ' + app1.name + ': ' + (app1.description?.substring(0, 40) || 'N/A') + '...\n';
    response += '  ' + app2.name + ': ' + (app2.description?.substring(0, 40) || 'N/A') + '...\n\n';

    const winner = (app1.rating || 0) > (app2.rating || 0) ? app1.name : app2.name;
    response += '🏆 Based on ratings: ' + winner + ' wins!';

    return response;
  }

  handleRecommend() {
    if (this.appCache.length === 0) {
      return 'No apps available yet.';
    }

    const recommended = [...this.appCache]
      .filter(a => a.rating && a.rating > 0)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5);

    if (recommended.length === 0) {
      return 'No rated apps yet.';
    }

    let response = '⭐ Top Recommended Apps:\n';
    response += '━━━━━━━━━━━━━━━━━━━\n\n';

    recommended.forEach((app, i) => {
      response += (i + 1) + '. ' + app.name + '\n';
      response += '   ⭐ ' + app.rating.toFixed(1) + '/5 (' + (app.review_count || 0) + ' reviews)\n';
      response += '   📂 ' + (app.category || 'N/A') + '\n\n';
    });

    response += '💡 Type "details [app name]" to learn more\n';
    response += '🔗 Type "rating [app name]" for user reviews';

    return response;
  }

  handleRating(query) {
    const words = query.toLowerCase().split(/\s+/).slice(1);
    const appName = words.join(' ');

    if (!appName) {
      return '⭐ Which app? Type: "rating [app name]"';
    }

    const app = this.appCache.find(a =>
      a.name.toLowerCase().includes(appName)
    );

    if (!app) {
      return '❌ App not found';
    }

    const rating = app.rating || 0;
    const stars = '⭐'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));

    let response = '📊 ' + app.name + '\n';
    response += '━━━━━━━━━━━\n';
    response += '🌟 Rating: ' + rating.toFixed(1) + '/5 ' + stars + '\n';
    response += '👥 Reviews: ' + (app.review_count || 0) + '\n\n';

    if (rating >= 4.5) {
      response += '✅ Highly Recommended!\n';
    } else if (rating >= 4) {
      response += '👍 Good app\n';
    } else if (rating >= 3) {
      response += '👌 Average\n';
    } else {
      response += '⚠️ Low rating\n';
    }

    return response;
  }

  handlePermissions(query) {
    const words = query.toLowerCase().split(/\s+/).slice(1);
    const appName = words.join(' ');

    if (!appName) {
      return '🔐 Which app? Type: "permissions [app name]"';
    }

    const app = this.appCache.find(a =>
      a.name.toLowerCase().includes(appName)
    );

    if (!app) {
      return '❌ App not found';
    }

    let response = '🔐 ' + app.name + ' - Permissions & Security\n';
    response += '━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

    if (app.permissions) {
      response += app.permissions;
    } else {
      response += 'Permissions info not available\n';
    }

    response += '\n\n💡 Tip: Review all permissions before installing\n';
    response += '⚠️ Be cautious with apps requesting unusual permissions';

    return response;
  }

  handleTrending() {
    if (this.appCache.length === 0) {
      return 'No apps available yet.';
    }

    const trending = [...this.appCache]
      .filter(a => a.review_count && a.review_count > 0)
      .sort((a, b) => (b.review_count || 0) - (a.review_count || 0))
      .slice(0, 5);

    if (trending.length === 0) {
      return 'No reviewed apps yet.';
    }

    let response = '🔥 Trending Apps (Most Reviewed):\n';
    response += '━━━━━━━━━━━━━━━━━━\n\n';

    trending.forEach((app, i) => {
      response += (i + 1) + '. 🔥 ' + app.name + '\n';
      response += '   👥 ' + (app.review_count || 0) + ' reviews\n';
      response += '   ⭐ ' + (app.rating || 'N/A') + '/5\n\n';
    });

    return response;
  }

  async handleUpdates() {
    try {
      if (!window.supabaseClient) {
        return '⚠️ Cannot load updates (database unavailable)';
      }

      const { data: updates } = await window.supabaseClient
        .from('website_updates')
        .select('title, version, published_date')
        .eq('status', 'published')
        .order('published_date', { ascending: false })
        .limit(5);

      if (!updates || updates.length === 0) {
        return '📰 No updates yet';
      }

      let response = '📰 Latest Updates:\n';
      response += '━━━━━━━━━━━━━\n\n';

      updates.forEach((update, i) => {
        response += (i + 1) + '. ' + update.title + '\n';
        if (update.version) response += '   ' + update.version + '\n';
        response += '   📅 ' + new Date(update.published_date).toLocaleDateString() + '\n\n';
      });

      return response;
    } catch (error) {
      return '⚠️ Could not fetch updates';
    }
  }

  handleGeneralQA(query) {
    const responses = {
      'কী': 'আপনি কোন অ্যাপ সম্পর্কে জানতে চান? "search [app name]" টাইপ করুন।',
      'কিভাবে': 'আপনাকে কি কোন অ্যাপ খুঁজে পেতে সাহায্য লাগছে?',
      'কোথায়': 'যেকোনো অ্যাপ খুঁজতে "search [app name]" টাইপ করুন।',
      'কী অ্যাপ': 'আমাদের ক্যাটালগে হাজারো অ্যাপ আছে। কি ধরনের অ্যাপ খুঁজছেন?',
      'নতুন': 'সর্বশেষ আপডেট জানতে "updates" টাইপ করুন।',
      'ধন্যবাদ': 'আপনাকেও স্বাগতম! 😊',
      'hello': 'Hi! 👋 Type "help" to see what I can do',
      'hi': 'Hello! 😊 How can I help?',
      'thanks': 'You\'re welcome! 🙂',
    };

    for (const [key, value] of Object.entries(responses)) {
      if (query.toLowerCase().includes(key)) {
        return value;
      }
    }

    // Default response
    return '😊 I\'m MRZN AI Assistant!\n' +
      'I can help you find apps, compare them, and more.\n\n' +
      'Try: "help"';
  }

  getHelp() {
    return `🤖 MRZN AI Assistant - Help Guide
━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 SEARCHING & BROWSING:
  • "find Termux" - Search for an app
  • "search games" - Search by category
  • "trending" - See most reviewed apps
  • "categories" - View all categories

📱 APP INFORMATION:
  • "details Termux" - Full app info
  • "rating Termux" - User ratings
  • "permissions Termux" - Security info
  • "recommend" - Best rated apps

⚖️ COMPARISON:
  • "compare app1 vs app2" - Compare apps

📰 WEBSITE INFO:
  • "updates" - Latest website updates
  • "help" - This message

💡 SUPPORTED LANGUAGES:
  Bengali, Banglish, English
  Auto-corrects typos!

🎯 Just ask naturally in any language!`;
  }
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.ollamaAI = new OllamaAI();
  });
} else {
  window.ollamaAI = new OllamaAI();
  }
