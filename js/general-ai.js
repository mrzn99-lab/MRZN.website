/**
 * 🤖 General Purpose AI - ANY Question Answering
 * Not just apps - handles everything
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
      console.log('🤖 Initializing General AI...');
      await this.waitForDB();
      await this.loadAppData();
      this.isReady = true;
      console.log('✅ General AI Ready');
    } catch (err) {
      console.error('AI init:', err);
      this.isReady = true;
    }
  }

async loadAppData() {
    try {
      // LINE 37: পরিবর্তন
      if (!window.supabaseClient) {
        console.warn('Supabase not available');
        return;
      }

      console.log('🔄 Loading apps from database...');

      // LINE 43: পরিবর্তন
      const { data: apps, error } = await window.supabaseClient
        .from('apps')
        .select('id, name, description, category, rating, review_count, icon_url, downloads, size')
        .limit(1000);

      if (error) {
        console.error('❌ Load error:', error.message);
        this.appCache = [];
        return;
      }

      if (!apps) {
        console.warn('No apps returned');
        this.appCache = [];
        return;
      }

      this.appCache = apps;
      console.log('✅ Apps loaded: ' + this.appCache.length);

      if (this.appCache.length > 0) {
        console.log('First app:', this.appCache[0].name);
      }
    } catch (err) {
      console.error('Data load error:', err);
      this.appCache = [];
    }
  }

  async loadAppData() {
    try {
      if (!window.supabaseClient) {
        console.warn('Supabase not available');
        return;
      }

      const { data: apps, error } = await window.supabaseClient
        .from('apps')
        .select('*')
        .limit(1000);

      if (error) {
        console.error('Load error:', error);
        this.appCache = [];
        return;
      }

      this.appCache = apps || [];
      console.log('✅ Loaded ' + this.appCache.length + ' apps');
    } catch (err) {
      console.error('Data error:', err);
      this.appCache = [];
    }
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
    
    // Exact match
    let app = this.appCache.find(a => a?.name?.toLowerCase() === q);
    if (app) return app;
    
    // Partial match
    app = this.appCache.find(a =>
      a?.name?.toLowerCase().includes(q) ||
      a?.description?.toLowerCase().includes(q)
    );
    if (app) return app;
    
    // Typo match
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

  // ============ RESPONSE BUILDERS ============

  handleAppSearch(input) {
    const terms = String(input).split(/\s+/).filter(w => 
      !['search', 'find', 'খোঁজো', 'খুঁজুন', 'app', 'apps', 'app्प'].includes(w)
    );
    const query = terms.join(' ') || String(input).replace(/search|find|খোঁজো|খুঁজুন/gi, '').trim();
    
    if (!query) {
      return '🔍 What app are you looking for? Tell me the app name.';
    }

    const results = this.searchApps(query);
    
    if (results.length === 0) {
      return '❌ Could not find "' + query + '"\n\nTry:\n• Search differently\n• "best apps"\n• "trending"\n• "categories"';
    }

    let response = '✅ Found ' + results.length + ' app(s):\n\n';
    results.forEach((a, i) => {
      response += (i+1) + '. ' + a.name + ' ⭐' + (a.rating?.toFixed(1) || 'N/A') + '/5\n';
    });
    response += '\n📝 Type "details [app name]" to learn more';
    
    return response;
  }

  handleAppDetails(input) {
    const name = String(input).replace(/details|about|info|সম্পর্কে|বিবরণ/gi, '').trim();
    if (!name) return '📱 Which app? Example: "details Termux"';

    const app = this.findApp(name);
    if (!app) return '❌ App "' + name + '" not found';

    let response = '📱 ' + app.name + '\n';
    response += '━━━━━━━━━━━\n';
    response += '⭐ Rating: ' + (app.rating?.toFixed(1) || 'N/A') + '/5\n';
    response += '👥 Reviews: ' + (app.review_count || 0) + '\n';
    response += '📂 Category: ' + (app.category || 'N/A') + '\n';
    response += '📦 Size: ' + (app.size || 'N/A') + '\n';
    response += '📝 ' + (app.description?.substring(0, 200) || 'No description');
    
    return response;
  }

  handleComparison(input) {
    const parts = String(input).split(/\svs\s|vs\s|vs/i);
    if (parts.length < 2) return '⚖️ Usage: "compare app1 vs app2"';

    const app1 = this.findApp(parts[0]);
    const app2 = this.findApp(parts[1]);

    if (!app1 || !app2) return '❌ Could not find both apps';

    let response = '⚖️ ' + app1.name + ' vs ' + app2.name + '\n';
    response += '⭐ Rating: ' + (app1.rating?.toFixed(1) || 'N/A') + ' vs ' + (app2.rating?.toFixed(1) || 'N/A') + '\n';
    response += '👥 Reviews: ' + (app1.review_count || 0) + ' vs ' + (app2.review_count || 0) + '\n';
    response += '📂 Category: ' + (app1.category || 'N/A') + ' vs ' + (app2.category || 'N/A');
    
    if (app1.rating > app2.rating) {
      response += '\n\n🏆 Winner: ' + app1.name;
    } else if (app2.rating > app1.rating) {
      response += '\n\n🏆 Winner: ' + app2.name;
    } else {
      response += '\n\n🤝 Tie!';
    }
    
    return response;
  }

  handleGeneralQuestion(input) {
    const msg = String(input).toLowerCase();
    
    // Greetings
    const greetings = {
      'hello': '👋 Hello! I\'m MRZN AI. How can I help you today?',
      'hi': '😊 Hey there! What can I do for you?',
      'hey': '👋 Hey! Ask me anything!',
      'হাই': '👋 হ্যালো! আমি MRZN AI। আপনি কিভাবে আছেন?',
      'হ্যালো': '😊 নমস্কার! আমাকে কিছু জিজ্ঞাসা করুন।',
      'কেমন': '😊 আমি ভালো আছি, ধন্যবাদ! আপনি কিভাবে আছেন?',
      'thanks': '😊 You\'re welcome!',
      'ধন্যবাদ': '😊 স্বাগতম!',
      'thanks': '😊 Anytime!',
      'ok': '👍 Got it!',
      'okay': '✅ Sure!',
    };

    for (const [key, val] of Object.entries(greetings)) {
      if (msg.includes(key)) return val;
    }

    // Personal questions
    if (msg.includes('আপনার নাম') || msg.includes('name')) {
      return '🤖 I\'m MRZN AI - an intelligent assistant built to help you find apps and answer any question!\n\nআমি MRZN AI - একটি বুদ্ধিমান সহায়ক যা আপনাকে অ্যাপ খুঁজে পেতে এবং যেকোনো প্রশ্নের উত্তর দিতে সাহায্য করি।';
    }

    if (msg.includes('আপনি কে') || msg.includes('who are')) {
      return '🤖 I\'m MRZN AI, your intelligent assistant!\n\nI can:\n✅ Help you find apps\n✅ Answer any question\n✅ Have conversations in Bengali, Banglish, or English\n✅ Understand typos and errors\n\nJust ask me anything!';
    }

    if (msg.includes('কী করতে পারো') || msg.includes('what can') || msg.includes('কী পার')) {
      return '🤖 I can help with:\n\n📱 Apps:\n• Search for apps\n• Show app details\n• Compare apps\n• See ratings\n\n💬 General:\n• Answer any question\n• Have conversations\n• Help with information\n\nJust ask! I understand Bengali, Banglish, English & typos!';
    }

    // App-related questions
    if (msg.includes('app') || msg.includes('অ্যাপ') || msg.includes('game') || msg.includes('গেম')) {
      const topApps = [...this.appCache]
        .filter(a => a?.rating)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 3);

      if (topApps.length > 0) {
        let response = '📱 Popular apps:\n\n';
        topApps.forEach((a, i) => {
          response += (i+1) + '. ' + a.name + ' ⭐' + a.rating.toFixed(1) + '\n';
        });
        response += '\n📝 Type "search [app name]" to find any app\n📝 Type "details [app]" for info';
        return response;
      }
      
      return 'I help you find apps!\n\nTry:\n• "search Termux"\n• "best apps"\n• "trending"\n• "categories"';
    }

    // Time/Date questions
    if (msg.includes('সময়') || msg.includes('তারিখ') || msg.includes('কোন দিন') || msg.includes('আজ')) {
      const now = new Date();
      return '📅 ' + now.toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      }) + '\n⏰ ' + now.toLocaleTimeString('bn-BD');
    }

    // Default helpful response
    return '😊 I\'m here to help!\n\n🤖 I can:\n• Find apps (search, compare, ratings)\n• Answer questions\n• Chat in Bengali/English\n• Understand typos\n\nJust ask me anything!\n\nType "help" to see all commands.';
  }

  handleHelp() {
    return `🤖 MRZN AI - Complete Help
━━━━━━━━━━━━━━━━━━━━━━━

📱 APP COMMANDS:
  search [app] - Find an app
  details [app] - Full information
  compare [app1] vs [app2] - Compare
  rating [app] - User ratings
  best apps - Top rated
  trending - Most popular
  categories - All categories

💬 GENERAL:
  Just ask any question!
  I answer in Bengali, Banglish, English

🎯 EXAMPLES:
  "find Termux"
  "details AIDE"
  "best games"
  "hello" - Start conversation
  "আপনার নাম কী?" - Ask in Bengali
  "help" - This message

💡 I understand typos & slang!`;
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

      // CATEGORIZE & RESPOND
      if (msg.includes('search') || msg.includes('find') || msg.includes('খোঁজো') || msg.includes('খুঁজুন')) {
        response = this.handleAppSearch(input);
      }
      else if (msg.includes('details') || msg.includes('about') || msg.includes('info') || msg.includes('সম্পর্কে')) {
        response = this.handleAppDetails(input);
      }
      else if (msg.includes(' vs ') || msg.includes('compare')) {
        response = this.handleComparison(input);
      }
      else if (msg.includes('rating') || msg.includes('rate') || msg.includes('রেটিং')) {
        const name = String(input).replace(/rating|rate|রেটিং/gi, '').trim();
        const app = this.findApp(name);
        if (app) {
          const stars = '⭐'.repeat(Math.round(app.rating || 0));
          response = '📊 ' + app.name + '\n' + app.rating.toFixed(1) + '/5 ' + stars + '\n👥 ' + app.review_count + ' reviews';
        } else {
          response = '❌ App not found';
        }
      }
      else if (msg.includes('best') || msg.includes('top') || msg.includes('সেরা')) {
        const top = [...this.appCache]
          .filter(a => a?.rating)
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 5);
        response = top.length > 0 ? '⭐ Top Rated:\n\n' + top.map((a, i) => (i+1) + '. ' + a.name + ' (' + a.rating.toFixed(1) + '/5)').join('\n') : 'No apps yet';
      }
      else if (msg.includes('trending') || msg.includes('popular') || msg.includes('ট্রেন্ডিং')) {
        const trend = [...this.appCache]
          .filter(a => a?.review_count)
          .sort((a, b) => (b.review_count || 0) - (a.review_count || 0))
          .slice(0, 5);
        response = trend.length > 0 ? '🔥 Trending:\n\n' + trend.map((a, i) => (i+1) + '. ' + a.name + ' (' + a.review_count + ' reviews)').join('\n') : 'No apps yet';
      }
      else if (msg.includes('categor')) {
        const cats = [...new Set(this.appCache.map(a => a?.category).filter(Boolean))].sort();
        response = '📂 Categories:\n' + cats.slice(0, 10).join(', ');
      }
      else if (msg.includes('help')) {
        response = this.handleHelp();
      }
      else {
        response = this.handleGeneralQuestion(input);
      }

      this.history.push({ role: 'assistant', content: response });
      if (this.history.length > 50) this.history = this.history.slice(-50);

      return response;
    } catch (error) {
      console.error('Process error:', error);
      return '😊 I\'m here to help! Ask me anything - apps, questions, or just chat!';
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
