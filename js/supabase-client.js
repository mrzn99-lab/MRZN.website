const SUPABASE_URL = "https://qweyjpqxvixyzoremhon.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3ZXlqcHF4dml4eXpvcmVtaG9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMTIzOTYsImV4cCI6MjA5OTc4ODM5Nn0.Bntl040U9kmWm2YmtJYcqUZ3n7SkhfOb581FTh-3xt4";
const ADMIN_EMAILS = ["mdrafiuzzamanking99@gmail.com"];

//const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabaseClient = null;

// Line 14: Initialize function
async function initSupabaseClient() {
  try {
    console.log('🔌 Initializing Supabase...');
    
    // Line 18: Wait for Supabase library to load
    if (typeof supabase === 'undefined') {
      console.warn('⚠️ Supabase library not loaded yet, waiting...');
      return new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (typeof supabase !== 'undefined') {
            clearInterval(checkInterval);
            initSupabaseClient().then(resolve);
          }
        }, 100);
      });
    }

    // Line 31: Create client
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    
    console.log('✅ Supabase client created');
    
    // Line 36: Test connection
    try {
      const { data, error } = await window.supabaseClient
        .from('apps')
        .select('count', { count: 'exact' })
        .limit(1);
      
      if (error) {
        console.error('⚠️ Database test error:', error.message);
      } else {
        console.log('✅ Database connection verified');
      }
    } catch (testErr) {
      console.warn('⚠️ Database test failed:', testErr.message);
    }
    
    return window.supabaseClient;
    
  } catch (err) {
    console.error('❌ Supabase init error:', err);
    return null;
  }
}

// Line 60: Auto-initialize on script load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSupabaseClient);
} else {
  initSupabaseClient();
}

// Line 67: Export for external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initSupabaseClient };
        }
