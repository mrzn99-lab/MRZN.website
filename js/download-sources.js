/**
 * 📦 Download Sources Manager
 */

class DownloadSourcesManager {
  static async displayDownloadSources(appId) {
    try {
      if (!appId || !window.supabaseClient) return;

      const { data: app } = await window.supabaseClient
        .from('apps')
        .select('source_type,source_url,apk_size_mb,min_android_version')
        .eq('id', appId)
        .single();

      if (!app) return;

      const container = document.getElementById('download-sources');
      if (!container) return;

      const sourceType = app.source_type || 'play_store';
      let html = '';

      // Play Store
      if (sourceType === 'play_store' || sourceType === 'both') {
        html += `
          <div class="download-option" onclick="window.open('https://play.google.com/store/apps/details?id=${appId}','_blank')">
            <div class="download-option-icon">▶️</div>
            <div class="download-option-name">Play Store</div>
            <div class="download-option-meta">Official</div>
            <button class="btn-download">Download</button>
          </div>
        `;
      }

      // Hosted
      if ((sourceType === 'hosted' || sourceType === 'both') && app.source_url) {
        try {
          const url = sourceType === 'both' ? JSON.parse(app.source_url).hosted : app.source_url;
          if (url) {
            html += `
              <div class="download-option" onclick="window.open('${url}','_blank')">
                <div class="download-option-icon">📥</div>
                <div class="download-option-name">Direct</div>
                <div class="download-option-meta">Hosted</div>
                <button class="btn-download">Download</button>
              </div>
            `;
          }
        } catch (e) {}
      }

      // External
      if (sourceType === 'external' && app.source_url) {
        const name = this.getSourceName(app.source_url);
        html += `
          <div class="download-option" onclick="window.open('${app.source_url}','_blank')">
            <div class="download-option-icon">🔗</div>
            <div class="download-option-name">${name}</div>
            <div class="download-option-meta">Third Party</div>
            <button class="btn-download">Download</button>
          </div>
        `;
        
        const warning = document.getElementById('source-warning');
        if (warning) {
          warning.style.display = 'block';
          const text = document.getElementById('warning-text');
          if (text) text.textContent = 'This app is from a third-party source. Download at your own risk.';
        }
      }

      // Info
      const info = [];
      if (app.apk_size_mb) info.push('📦 ' + app.apk_size_mb + 'MB');
      if (app.min_android_version) info.push('📱 Android ' + app.min_android_version + '+');
      
      if (info.length > 0) {
        html += '<div style="grid-column:1/-1;font-size:12px;color:#888;text-align:center;margin-top:8px;padding:12px;background:rgba(0,229,255,0.05);border-radius:6px;">' + info.join(' • ') + '</div>';
      }

      container.innerHTML = html;
    } catch (error) {
      console.error('Download sources error:', error);
    }
  }

  static getSourceName(url) {
    const domain = (url || '').toLowerCase();
    if (domain.includes('f-droid')) return 'F-Droid';
    if (domain.includes('uptodown')) return 'Uptodown';
    if (domain.includes('apkpure')) return 'APK Pure';
    if (domain.includes('apkmirror')) return 'APK Mirror';
    if (domain.includes('github')) return 'GitHub';
    return 'Third Party';
  }

  static getSourceBadge(sourceType) {
    const badges = {
      play_store: '🏪 Play Store',
      hosted: '📥 Hosted',
      external: '🔗 External',
      both: '📦 Multiple'
    };
    return badges[sourceType] || '❓ Unknown';
  }
}

if (!window.DownloadSourcesManager) {
  window.DownloadSourcesManager = DownloadSourcesManager;
}
