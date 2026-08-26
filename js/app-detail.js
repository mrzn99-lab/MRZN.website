/**
 * 📱 App Details Page - Complete
 * Load and display app information
 */

let currentApp = null;

document.addEventListener("DOMContentLoaded", async () => {
  console.log('📱 Loading app details...');
  
  // Get app ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const appId = urlParams.get('id');

  if (!appId) {
    console.error('❌ No app ID provided');
    showError('App not found');
    return;
  }

  console.log('🔍 Loading app:', appId);

  try {
    // Wait for database
    await waitForDatabase();

    // Load app
    await loadAppDetail(appId);

    // Apply language translation
    await applyLanguageToAppDetails();

  } catch (error) {
    console.error('Error:', error);
    showError('Error loading app');
  }
});

// ============ LOAD APP ============

async function waitForDatabase() {
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
        console.warn('⚠️ Database timeout');
        resolve();
      }
    };
    check();
  });
}

async function loadAppDetail(appId) {
  try {
    if (!window.supabaseClient) {
      showError('Database not connected');
      return;
    }

    console.log('📥 Fetching app from database...');

    const { data: app, error } = await window.supabaseClient
      .from('apps')
      .select('*')
      .eq('id', appId)
      .single();

    if (error) {
      console.error('Query error:', error);
      showError('App not found');
      return;
    }

    if (!app) {
      console.error('No app found');
      showError('App not found');
      return;
    }

    console.log('✅ App loaded:', app.name);
    currentApp = app;

    // Render app
    renderAppDetail(app);

    // Add to recently viewed
    addToRecentlyViewed(app);

  } catch (error) {
    console.error('Load error:', error);
    showError('Error loading app');
  }
}

function renderAppDetail(app) {
  try {
    console.log('🎨 Rendering app detail...');

    // Create container
    let container = document.getElementById('app-detail-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'app-detail-container';
      document.body.appendChild(container);
    }

    // Build HTML
    container.innerHTML = `
      <div style="max-width: 900px; margin: 0 auto; padding: 20px;">
        
        <!-- Header -->
        <div style="display: flex; gap: 20px; margin-bottom: 30px; align-items: start;">
          <img src="${escapeHTML(app.icon_url || 'assets/placeholder-icon.svg')}" alt="${escapeHTML(app.name)}" style="
            width: 80px;
            height: 80px;
            border-radius: 16px;
            object-fit: cover;
            background: var(--panel-2);
          ">
          
          <div style="flex: 1;">
            <h1 style="margin: 0 0 8px 0; font-size: 28px;">${escapeHTML(app.name || 'Unknown App')}</h1>
            <div style="color: var(--text-dim); margin-bottom: 12px;">${escapeHTML(app.category || 'Category N/A')}</div>
            
            <div style="display: flex; gap: 16px; align-items: center;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 18px;">⭐</span>
                <span style="font-weight: 700; font-size: 16px;">${(app.rating || 0).toFixed(1)}</span>
                <span style="color: var(--text-dim); font-size: 13px;">(${app.review_count || 0} reviews)</span>
              </div>
              
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 16px;">📥</span>
                <span style="color: var(--text-dim); font-size: 13px;">${formatDownloads(app.downloads)}</span>
              </div>
            </div>
          </div>
          
          <button id="favorite-btn" onclick="toggleFavorite()" style="
            background: rgba(0, 229, 255, 0.1);
            border: 2px solid var(--cyan);
            color: var(--cyan);
            padding: 10px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 700;
            transition: all 0.2s;
          ">❤️ Save</button>
        </div>

        <!-- About Section -->
        <div style="margin-bottom: 30px;">
          <h2 style="margin-bottom: 12px;">About</h2>
          <div style="
            background: var(--panel-2);
            padding: 16px;
            border-radius: 8px;
            line-height: 1.6;
            color: var(--text-dim);
          " id="app-description">${escapeHTML(app.description || 'No description available')}</div>
        </div>

        <!-- Info Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 30px;">
          
          <div style="background: var(--panel-2); padding: 16px; border-radius: 8px;">
            <div style="color: var(--text-dim); font-size: 13px; margin-bottom: 6px;">📦 Size</div>
            <div style="font-weight: 700; font-size: 16px;">${escapeHTML(app.size || 'N/A')}</div>
          </div>

          <div style="background: var(--panel-2); padding: 16px; border-radius: 8px;">
            <div style="color: var(--text-dim); font-size: 13px; margin-bottom: 6px;">📱 Requires</div>
            <div style="font-weight: 700; font-size: 16px;">Android ${escapeHTML(app.min_android_version || '4.0+')}</div>
          </div>

          <div style="background: var(--panel-2); padding: 16px; border-radius: 8px;">
            <div style="color: var(--text-dim); font-size: 13px; margin-bottom: 6px;">👨‍💻 Developer</div>
            <div style="font-weight: 700; font-size: 16px;">${escapeHTML(app.developer || 'N/A')}</div>
          </div>

          <div style="background: var(--panel-2); padding: 16px; border-radius: 8px;">
            <div style="color: var(--text-dim); font-size: 13px; margin-bottom: 6px;">📅 Updated</div>
            <div style="font-weight: 700; font-size: 16px;">${formatDate(app.updated_at)}</div>
          </div>

        </div>

        <!-- Download Section -->
        <div id="download-section" style="margin-bottom: 30px;"></div>

      </div>
    `;

    // Initialize favorite button
    updateFavoriteButton();

    // Render download section
    if (window.renderDownloadSources) {
      window.renderDownloadSources(app, document.getElementById('download-section'));
    }

    console.log('✅ App rendered');

  } catch (error) {
    console.error('Render error:', error);
  }
}

// ============ LANGUAGE TRANSLATION ============

async function applyLanguageToAppDetails() {
  try {
    if (!window.languageManager) {
      console.warn('Language manager not ready');
      return;
    }

    const currentLang = window.languageManager.currentLang;
    if (currentLang === 'en') return;

    console.log('🌐 Translating to:', currentLang);

    // Translate description
    const descElement = document.getElementById('app-description');
    if (descElement && currentApp?.description) {
      const translated = await window.languageManager.translateText(
        currentApp.description,
        currentLang
      );
      if (translated) {
        descElement.textContent = translated;
      }
    }

    console.log('✅ App translated');

  } catch (error) {
    console.error('Translation error:', error);
  }
}

// ============ FAVORITES ============

function addToRecentlyViewed(app) {
  try {
    const recent = JSON.parse(localStorage.getItem('mrzn_recently_viewed') || '[]');
    
    // Remove if exists
    const filtered = recent.filter(a => a.id !== app.id);
    
    // Add to front
    filtered.unshift({
      id: app.id,
      name: app.name,
      icon: app.icon_url
    });

    // Keep last 20
    localStorage.setItem('mrzn_recently_viewed', JSON.stringify(filtered.slice(0, 20)));
    
    console.log('✅ Added to recently viewed');
  } catch (error) {
    console.error('Recently viewed error:', error);
  }
}

function toggleFavorite() {
  try {
    if (!currentApp) return;

    const favorites = JSON.parse(localStorage.getItem('mrzn_favorites') || '[]');
    const index = favorites.findIndex(a => a.id === currentApp.id);

    if (index > -1) {
      // Remove
      favorites.splice(index, 1);
    } else {
      // Add
      favorites.push({
        id: currentApp.id,
        name: currentApp.name,
        icon: currentApp.icon_url
      });
    }

    localStorage.setItem('mrzn_favorites', JSON.stringify(favorites));
    updateFavoriteButton();

    const message = index > -1 ? '❌ Removed from favorites' : '❤️ Added to favorites';
    showToast?.(message, 'success');

  } catch (error) {
    console.error('Favorite error:', error);
  }
}

function updateFavoriteButton() {
  try {
    if (!currentApp) return;

    const btn = document.getElementById('favorite-btn');
    if (!btn) return;

    const favorites = JSON.parse(localStorage.getItem('mrzn_favorites') || '[]');
    const isFavorite = favorites.some(a => a.id === currentApp.id);

    if (isFavorite) {
      btn.textContent = '❤️ Saved';
      btn.style.background = 'var(--cyan)';
      btn.style.color = 'var(--void)';
    } else {
      btn.textContent = '🤍 Save';
      btn.style.background = 'rgba(0, 229, 255, 0.1)';
      btn.style.color = 'var(--cyan)';
    }
  } catch (error) {
    console.error('Update button error:', error);
  }
}

// ============ HELPERS ============

function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDownloads(count) {
  if (!count) return 'N/A';
  if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
  return count.toString();
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (e) {
    return 'N/A';
  }
}

function showError(message) {
  const container = document.getElementById('app-detail-container');
  if (container) {
    container.innerHTML = `
      <div style="
        max-width: 600px;
        margin: 100px auto;
        text-align: center;
        padding: 40px;
        background: rgba(220, 38, 38, 0.1);
        border: 1px solid rgba(220, 38, 38, 0.3);
        border-radius: 8px;
      ">
        <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
        <div style="color: #fca5a5; font-size: 18px; font-weight: 700;">
          ${message}
        </div>
        <a href="index.html" style="
          display: inline-block;
          margin-top: 20px;
          background: var(--cyan);
          color: var(--void);
          padding: 10px 20px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 700;
        ">← Back to Home</a>
      </div>
    `;
  }
}
