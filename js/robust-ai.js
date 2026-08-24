/**
 * 🤖 Robust AI - Never Crashes
 * Handles ALL questions gracefully
 */

class RobustAI {
  constructor() {
    this.appCache = [];
    this.categories = [];
    this.isReady = false;
    this.history = [];
    this.init();
  }

  async init() {
    try {
      console.log('🤖 Initializing AI...');
      await this.waitForDB();
      await this.loadData();
      this.isReady = true;
      console.log('✅ AI Ready - ' + this.appCache.length + ' apps');
    } catch (err) {
      console.error('AI error:', err);
      this.isReady = true; // Continue anyway
    }
  }

  async waitForDB() {
    return new Promise((resolve) => {
      let tries = 0;
      const check = () => {
        if (window.supabaseClient) {
          resolve();
        } else if (tries < 50) {
          tries++;
          setTimeout(check, 100);
        } else {
          resolve();
        }
      };
      check();
    });
  }

  async loadData() {
    try {
      if (!window.supabaseClient) return;

      const { data: apps } = await window.supabaseClient
        .from('apps')
        .select('*')
        .limit(500);

      this.appCache = apps || [];
      this.categories = [...new Set(
        this.appCache.map(a => a?.category).filter(Boolean)
      )].sort();

      console.log('📦 Loaded ' + this.appCache.length + ' apps, ' + this.categories.length + ' categories');
    } catch (err) {
      console.error('Data error:', err);
    }
  }

  // ============ CORE FUNCTIONS ============

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
    if (!query) return null;
    
    const q = String(query).toLowerCase();
    
    // Exact
    let app = this.appCache.find(a => a?.name?.toLowerCase() === q);
    if (app) return app;
    
    // Contains
    app = this.appCache.find(a =>
      a?.name?.toLowerCase().includes(q) ||
      a?.description?.toLowerCase().includes(q)
    );
    if (app) return app;
    
    // Typo
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
    if (!query) return [];
    const q = String(query).toLowerCase();
    return this.appCache.filter(a =>
      a?.name?.toLowerCase().includes(q) ||
      a?.description?.toLowerCase().includes(q) ||
      a?.category?.toLowerCase().includes(q)
    ).slice(0, 5);
  }

  async processUserQuery(input) {
    try {
      if (!input || !String(input).trim()) {
        return 'Please ask something! Type "help" for commands.';
      }

      const msg = String(input).toLowerCase();
      this.history.push({ role: 'user', content: input });

      let response = '😊 I\'m here to help!';

      // SEARCH
      if (msg.includes('search') || msg.includes('find') || msg.includes('খোঁজো') || msg.includes('খুঁজুন') || msg.includes('app')) {
        const terms = String(input).split(/\s+/).filter(w => 
          !['search', 'find', 'খোঁজো', 'খুঁজুন', 'app', 'apps'].includes(w)
        );
        const query = terms.join(' ') || String(input).replace(/search|find/gi, '').trim();
        
        if (query) {
          const results = this.searchApps(query);
          if (results.length > 0) {
            response = '✅ Found ' + results.length + ' app(s):\n\n';
            results.forEach((a, i) => {
              response += (i+1) + '. ' + a.name + ' ⭐' + (a.rating || 'N/A') + '\n';
            });
            response += '\nType "details [app]" for more info';
          } else {
            response = '❌ No apps found for "' + query + '".\n\nTry:\n• Different keywords\n• "categories" to browse\n• "best apps"';
          }
        } else {
          response = '🔍 What app are you looking for?';
        }
      }

      // DETAILS
      else if (msg.includes('details') || msg.includes('about') || msg.includes('info')) {
        const name = String(input).replace(/details|about|info/gi, '').trim();
        const app = this.findApp(name);
        
        if (app) {
          response = '📱 ' + app.name + '\n';
          response += '⭐ Rating: ' + (app.rating || 'N/A') + '/5\n';
          response += '👥 Reviews: ' + (app.review_count || 0) + '\n';
          response += '📂 Category: ' + (app.category || 'N/A') + '\n';
          response += '📦 Size: ' + (app.size || 'N/A') + '\n';
          response += '📝 ' + (app.description || 'No description');
        } else {
          response = '❌ App not found. Try "search ' + name + '"';
        }
      }

      // COMPARE
      else if (msg.includes(' vs ') || msg.includes('compare')) {
        const parts = String(input).split(/\svs\s|vs\s|vs|compare/i);
        const app1 = this.findApp(parts[0]);
        const app2 = parts[1] ? this.findApp(parts[1]) : null;
        
        if (app1 && app2) {
          response = '⚖️ ' + app1.name + ' vs ' + app2.name + '\n';
          response += '⭐ ' + (app1.rating || 'N/A') + ' vs ' + (app2.rating || 'N/A') + '\n';
          response += '👥 ' + (app1.review_count || 0) + ' vs ' + (app2.review_count || 0) + ' reviews\n';
          response += '📂 ' + (app1.category || 'N/A') + ' vs ' + (app2.category || 'N/A');
          const winner = (app1.rating || 0) > (app2.rating || 0) ? app1.name : app2.name;
          response += '\n\n🏆 ' + winner + ' wins!';
        } else {
          response = '❌ Need both app names to compare.\nExample: "compare Termux vs Aide"';
        }
      }

      // RATING
      else if (msg.includes('rating') || msg.includes('rate') || msg.includes('রেটিং')) {
        const name = String(input).replace(/rating|rate|রেটিং/gi, '').trim();
        const app = this.findApp(name);
        
        if (app) {
          const stars = '⭐'.repeat(Math.round(app.rating || 0)) + '☆'.repeat(Math.max(0, 5 - Math.round(app.rating || 0)));
          response = '📊 ' + app.name + '\n' + (app.rating || 'N/A') + '/5 ' + stars + '\n👥 ' + (app.review_count || 0) + ' reviews';
        } else {
          response = '❌ App not found';
        }
      }

      // BEST/TOP
      else if (msg.includes('best') || msg.includes('top') || msg.includes('সেরা')) {
        const top = [...this.appCache]
          .filter(a => a?.rating)
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 5);
        
        if (top.length > 0) {
          response = '⭐ Top Rated Apps:\n\n';
          top.forEach((a, i) => {
            response += (i+1) + '. ' + a.name + ' (' + a.rating.toFixed(1) + '/5)\n';
          });
        } else {
          response = 'No rated apps yet';
        }
      }

      // TRENDING
      else if (msg.includes('trending') || msg.includes('popular') || msg.includes('ট্রেন্ডিং')) {
        const trend = [...this.appCache]
          .filter(a => a?.review_count)
          .sort((a, b) => (b.review_count || 0) - (a.review_count || 0))
          .slice(0, 5);
        
        if (trend.length > 0) {
          response = '🔥 Trending Apps:\n\n';
          trend.forEach((a, i) => {
            response += (i+1) + '. ' + a.name + ' (' + a.review_count + ' reviews)\n';
          });
        } else {
          response = 'No trending apps yet';
        }
      }

      // CATEGORIES
      else if (msg.includes('categor')) {
        response = '📂 Categories (' + this.categories.length + '):\n' + 
          this.categories.slice(0, 10).join(', ');
      }

      // HELP
      else if (msg.includes('help') || msg.includes('সাহায্য')) {
        response = `🤖 MRZN AI Help
━━━━━━━━━━━━━━
🔍 search [app]
📱 details [app]
⚖️ compare [app1] vs [app2]
⭐ rating [app]
🏆 best apps / top apps
🔥 trending
📂 categories
📰 updates

💡 Works in Bengali, Banglish, English!
Type naturally - I understand typos!`;
      }

      // DEFAULT: GENERAL Q&A
      else {
        const greetings = {
          'hello': '👋 Hi there!',
          'hi': '😊 Hello!',
          'hey': '👋 Hey!',
          'thanks': '😊 You\'re welcome!',
          'thank': '😊 Happy to help!',
          'কি': 'আপনি কোন অ্যাপ খুঁজছেন? "search [নাম]" টাইপ করুন।',
        };
        
        for (const [key, val] of Object.entries(greetings)) {
          if (msg.includes(key)) {
            response = val;
            break;
          }
        }
        
        if (response === '😊 I\'m here to help!') {
          response = 'I help you find apps! 📱\n\n' +
            'Try: "search Termux"\n' +
            'Or: "best apps"\n' +
            'Or: "help" for all commands';
        }
      }

      this.history.push({ role: 'assistant', content: response });
      if (this.history.length > 40) this.history = this.history.slice(-40);

      return response;
    } catch (error) {
      console.error('Process error:', error);
      return '😊 Ask me about apps! Try "help" for commands.';
    }
  }
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.robustAI = new RobustAI();
  });
} else {
  window.robustAI = new RobustAI();
}
