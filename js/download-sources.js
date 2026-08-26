
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

      let html = `
        <div style="margin-bottom: 30px;">
          <h2 style="margin-bottom: 16px;">📥 Download</h2>
          <div style="display: grid; grid-template-columns: 1fr; gap: 12px;">
      `;

      // Hosted APK
      if (app.source_url && app.source_type === 'hosted') {
        html += `
          <a href="${app.source_url}" download style="
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px;
            background: var(--panel-2);
            border: 1px solid rgba(0, 229, 255, 0.3);
            border-radius: 8px;
            text-decoration: none;
            color: var(--text);
            transition: all 0.2s;
          " onmouseover="this.style.background='rgba(0, 229, 255, 0.1)'" onmouseout="this.style.background='var(--panel-2)'">
            <div style="font-size: 24px;">📦</div>
            <div style="flex: 1;">
              <div style="font-weight: 700; margin-bottom: 4px;">Download APK</div>
              <div style="font-size: 12px; color: var(--text-dim);">Direct Download • ${app.apk_size_mb ? app.apk_size_mb + 'MB' : 'Size N/A'}</div>
            </div>
            <div style="font-size: 20px;">→</div>
          </a>
        `;
      }

      // External Link
      if (app.source_url && app.source_type === 'external') {
        html += `
          <a href="${app.source_url}" target="_blank" rel="noopener" style="
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px;
            background: var(--panel-2);
            border: 1px solid rgba(0, 229, 255, 0.3);
            border-radius: 8px;
            text-decoration: none;
            color: var(--text);
            transition: all 0.2s;
          " onmouseover="this.style.background='rgba(0, 229, 255, 0.1)'" onmouseout="this.style.background='var(--panel-2)'">
            <div style="font-size: 24px;">🔗</div>
            <div style="flex: 1;">
              <div style="font-weight: 700; margin-bottom: 4px;">External Source</div>
              <div style="font-size: 12px; color: var(--text-dim);">Open in Browser</div>
            </div>
            <div style="font-size: 20px;">→</div>
          </a>
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
