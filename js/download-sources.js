
class DownloadSourcesManager {
  constructor() {
    this.sources = {
      hosted: 'Hosted APK',
      external: 'External Link'
    };
  }

  getSourceBadge(type) {
    const badges = {
      hosted: '📦',
      external: '🔗'
    };
    return badges[type] || '📥';
  }

  async renderDownloadSources(app, container) {
    try {
      console.log('📥 Rendering download sources...');

      if (!container) return;

      // Check if user is logged in
      const { data: { session } } = await window.supabaseClient.auth.getSession();
      const isLoggedIn = !!session;

      let html = `
        <div style="margin-bottom: 30px;">
          <h2 style="margin-bottom: 16px;">📥 Download</h2>
      `;

      // Show login message if not authenticated
      if (!isLoggedIn) {
        html += `
          <div style="
            background: rgba(220, 38, 38, 0.1);
            border: 1px solid rgba(220, 38, 38, 0.3);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
            text-align: center;
            color: #fca5a5;
          ">
            🔒 <strong>Log in required to download</strong>
            <br><a href="login.html" style="color: #fca5a5; text-decoration: underline; font-weight: 600;">Go to Login</a>
          </div>
        `;
      }

      html += `<div style="display: grid; grid-template-columns: 1fr; gap: 12px;">`;

      // Hosted APK
      if (app.source_url && app.source_type === 'hosted') {
        html += `
          <button onclick="(async () => { 
            if (!${isLoggedIn}) { 
              showToast?.('🔒 Please log in to download', 'info');
              setTimeout(() => window.location.href = 'login.html', 500);
              return; 
            }
            window.open('${app.source_url.replace(/'/g, "\\'")}', '_blank', 'noopener,noreferrer');
          })(); return false;" style="
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px;
            background: ${isLoggedIn ? 'var(--panel-2)' : 'rgba(220, 38, 38, 0.15)'};
            border: 1px solid ${isLoggedIn ? 'rgba(0, 229, 255, 0.3)' : 'rgba(220, 38, 38, 0.3)'};
            border-radius: 8px;
            text-decoration: none;
            color: var(--text);
            transition: all 0.2s;
            cursor: pointer;
            font-family: inherit;
            font-size: 14px;
            text-align: left;
          " onmouseover="this.style.background='${isLoggedIn ? 'rgba(0, 229, 255, 0.1)' : 'rgba(220, 38, 38, 0.2)'}'" onmouseout="this.style.background='${isLoggedIn ? 'var(--panel-2)' : 'rgba(220, 38, 38, 0.15)'}'">
            <div style="font-size: 24px;">${isLoggedIn ? '📦' : '🔒'}</div>
            <div style="flex: 1;">
              <div style="font-weight: 700; margin-bottom: 4px;">${isLoggedIn ? 'Download APK' : 'Download (Log in Required)'}</div>
              <div style="font-size: 12px; color: var(--text-dim);">${isLoggedIn ? 'Direct Download • ' + (app.apk_size_mb ? app.apk_size_mb + 'MB' : 'Size N/A') : 'Sign in to download'}</div>
            </div>
            <div style="font-size: 20px;">→</div>
          </button>
        `;
      }

      // External Link
      if (app.source_url && app.source_type === 'external') {
        html += `
          <button onclick="(async () => { 
            if (!${isLoggedIn}) { 
              showToast?.('🔒 Please log in to download', 'info');
              setTimeout(() => window.location.href = 'login.html', 500);
              return; 
            }
            window.open('${app.source_url.replace(/'/g, "\\'")}', '_blank', 'noopener,noreferrer');
          })(); return false;" style="
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px;
            background: ${isLoggedIn ? 'var(--panel-2)' : 'rgba(220, 38, 38, 0.15)'};
            border: 1px solid ${isLoggedIn ? 'rgba(0, 229, 255, 0.3)' : 'rgba(220, 38, 38, 0.3)'};
            border-radius: 8px;
            text-decoration: none;
            color: var(--text);
            transition: all 0.2s;
            cursor: pointer;
            font-family: inherit;
            font-size: 14px;
            text-align: left;
          " onmouseover="this.style.background='${isLoggedIn ? 'rgba(0, 229, 255, 0.1)' : 'rgba(220, 38, 38, 0.2)'}'" onmouseout="this.style.background='${isLoggedIn ? 'var(--panel-2)' : 'rgba(220, 38, 38, 0.15)'}'">
            <div style="font-size: 24px;">${isLoggedIn ? '🔗' : '🔒'}</div>
            <div style="flex: 1;">
              <div style="font-weight: 700; margin-bottom: 4px;">${isLoggedIn ? 'External Source' : 'External (Log in Required)'}</div>
              <div style="font-size: 12px; color: var(--text-dim);">${isLoggedIn ? 'Open in Browser' : 'Sign in to download'}</div>
            </div>
            <div style="font-size: 20px;">→</div>
          </button>
        `;
      }

      html += `
          </div>
        </div>
      `;

      container.innerHTML = html;
      console.log('✅ Download sources rendered');

    } catch (error) {
      console.error('Render error:', error);
    }
  }
}

// Initialize
const downloadManager = new DownloadSourcesManager();

window.renderDownloadSources = function(app, container) {
  downloadManager.renderDownloadSources(app, container);
};
