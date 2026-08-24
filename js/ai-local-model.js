/**
 * 🤖 MRZN Local AI - Simplified Version
 */

class MRZNLocalAI {
  constructor() {
    this.isReady = false;
    this.appCache = [];
    this.init();
  }

  async init() {
    try {
      console.log('🤖 Initializing MRZN AI...');
      
      // Wait for Supabase
      await this.waitForSupabase();
      
      // Load apps
      await this.loadAppCache();
      
      this.isReady = true;
      console.log('✅ MRZN AI Ready - ' + this.appCache.length + ' apps loaded');
    } catch (error) {
      console.error('AI Error:', error);
      this.isReady = true; // Continue anyway
    }
  }

  async waitForSupabase() {
    return new Promise((resolve) => {
      if (window.supabaseClient) {
        console.log('✅ Supabase ready');
        resolve();
        return;
      }
      
      let attempts = 0;
      const check = () => {
        if (window.supabaseClient) {
          console.log('✅ Supabase ready');
          resolve();
        } else if (attempts < 30) {
          attempts++;
          setTimeout(check, 100);
        } else {
          console.warn('⚠️ Supabase timeout');
          resolve();
        }
      };
      check();
    });
  }

  async loadAppCache() {
    try {
      if (!window.supabaseClient) {
        console.warn('Supabase not available');
        return;
      }
      
      const { data, error } = await window.supabaseClient
        .from('apps')
        .select('id,name,description,category,rating,review_count,icon_url');
      
      if (error) throw error;
      
      this.appCache = data || [];
      console.log('📦 Loaded ' + this.appCache.length + ' apps');
    } catch (error) {
      console.error('Load error:', error.message);
      this.appCache = [];
    }
  }

  async processUserQuery(userInput) {
    try {
      if (!userInput) return { message: '❓ Type something', results: [] };
      
      const term = userInput.toLowerCase();
      
      // Direct search
      const results = this.appCache.filter(app => {
        const name = (app.name || '').toLowerCase();
        const desc = (app.description || '').toLowerCase();
        return name.includes(term) || desc.includes(term);
      }).slice(0, 5);
      
      if (results.length === 0) {
        return { 
          message: '❌ No apps found for "' + userInput + '"',
          results: [] 
        };
      }
      
      return {
        message: '✅ Found ' + results.length + ' app(s)',
        results: results
      };
    } catch (error) {
      console.error('Query error:', error);
      return { message: '❌ Error', results: [] };
    }
  }
}

// Initialize
if (!window.mrzn_ai) {
  window.mrzn_ai = new MRZNLocalAI();
}
