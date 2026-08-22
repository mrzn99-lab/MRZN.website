/**
 * 📦 Download Sources Manager
 * Manages multiple app download sources
 * Supports: Play Store, Direct Download, External Sources
 */

class DownloadSourcesManager {
  static SOURCE_TYPES = {
    PLAY_STORE: 'play_store',
    HOSTED: 'hosted',
    EXTERNAL: 'external',
    BOTH: 'both'
  };

  static getSourceName(sourceType) {
    const names = {
      play_store: 'Google Play Store',
      hosted: 'Direct Download',
      external: 'Third Party',
      both: 'Multiple Sources'
    };
    return names[sourceType] || 'Unknown';
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

  static getExternalSourceName(url) {
    if (!url) return 'Third Party';
    
    const domain = url.toLowerCase();
    
    if (domain.includes('f-droid')) return 'F-Droid';
    if (domain.includes('uptodown')) return 'Uptodown';
    if (domain.includes('softonic')) return 'Softonic';
    if (domain.includes('apkpure')) return 'APK Pure';
    if (domain.includes('apkmirror')) return 'APK Mirror';
    if (domain.includes('github')) return 'GitHub';
    if (domain.includes('sourceforge')) return 'SourceForge';
    if (domain.includes('amazon')) return 'Amazon Appstore';
    if (domain.includes('samsung')) return 'Samsung Galaxy Store';
    
    return 'Third Party';
  }

  static getExternalSourceIcon(url) {
    if (!url) return '🔗';
    
    const domain = url.toLowerCase();
    
    if (domain.includes('f-droid')) return '🔓';
    if (domain.includes('uptodown')) return '📱';
    if (domain.includes('softonic')) return '💿';
    if (domain.includes('apkpure')) return '🔑';
    if (domain.includes('apkmirror')) return '🪞';
    if (domain.includes('github')) return '🐙';
    if (domain.includes('amazon')) return '🛒';
    if (domain.includes('samsung')) return '🔷';
    
    return '🔗';
  }

  static async displayDownloadSources(appId) {
    try {
      if (!appId) return;

      if (!window.supabaseClient) {
        console.warn('⚠️ Supabase not ready for download sources');
        return;
      }

      const { data: app, error } = await window.supabaseClient
        .from('apps')
        .select('id, name, source_type, source_url, apk_size_mb, min_android_version')
        .eq('id', appId)
        .single();

      if (error || !app) {
        console.warn('App not found for download sources:', error);
        return;
      }

      const container = document.getElementById('download-sources');
      if (!container) return;

      let html = '';
      const sourceType = app.source_type || 'play_store';

      // Play Store
      if (sourceType === 'play_store' || sourceType === 'both') {
        html += `
          <div class="download-option" onclick="window.open('https://play.google.com/store/apps/details?id=${appId}', '_blank')">
            <div class="download-option-icon">▶️</div>
            <div class="download-option-name">Play Store</div>
            <div class="download-option-meta">Official Source</div>
            <button class="btn-download">Download</button>
          </div>
        `;
      }

      // Hosted source (for 'both')
      if (sourceType === 'both' && app.source_url) {
        try {
          const sources = JSON.parse(app.source_url);
          if (sources && sources.hosted) {
            html += `
              <div class="download-option" onclick="window.open('${sources.hosted}', '_blank')">
                <div class="download-option-icon">📥</div>
                <div class="download-option-name">Direct</div>
                <div class="download-option-meta">Hosted Download</div>
                <button class="btn-download">Download</button>
              </div>
            `;
          }
        } catch (e) {
          console.warn('Error parsing dual sources:', e);
        }
      }
      // Direct hosted
      else if (sourceType === 'hosted' && app.source_url) {
        html += `
          <div class="download-option" onclick="window.open('${app.source_url}', '_blank')">
            <div class="download-option-icon">📥</div>
            <div class="download-option-name">Direct</div>
            <div class="download-option-meta">Hosted Download</div>
            <button class="btn-download">Download</button>
          </div>
        `;
      }
      // External source
      else if (sourceType === 'external' && app.source_url) {
        const externalName = this.getExternalSourceName(app.source_url);
        const externalIcon = this.getExternalSourceIcon(app.source_url);
        
        html += `
          <div class="download-option" onclick="window.open('${app.source_url}', '_blank')">
            <div class="download-option-icon">${externalIcon}</div>
            <div class="download-option-name">${externalName}</div>
            <div class="download-option-meta">Third Party</div>
            <button class="btn-download">Download</button>
          </div>
        `;

        // Show warning
        const warningBox = document.getElementById('source-warning');
        if (warningBox) {
          warningBox.style.display = 'block';
          const warningText = document.getElementById('warning-text');
          if (warningText) {
            warningText.textContent = `This app is hosted on ${externalName}. Download at your own risk.`;
          }
        }
      }

      // App info
      if (app.apk_size_mb || app.min_android_version) {
        const info = [];
        if (app.apk_size_mb) info.push(`📦 ${app.apk_size_mb}MB`);
        if (app.min_android_version) info.push(`📱 Android ${app.min_android_version}+`);

        if (info.length > 0) {
          html += `
            <div style="grid-column: 1 / -1; font-size: 12px; color: #888; text-align: center; margin-top: 8px; padding: 12px; background: rgba(0, 229, 255, 0.05); border-radius: 6px;">
              ${info.join(' • ')}
            </div>
          `;
        }
      }

      container.innerHTML = html;
    } catch (error) {
      console.error('Error displaying download sources:', error);
    }
  }

  static async getAvailableSources(appId) {
    try {
      if (!window.supabaseClient || !appId) return [];

      const { data: app } = await window.supabaseClient
        .from('apps')
        .select('source_type, source_url')
        .eq('id', appId)
        .single();

      if (!app) return [];

      const sources = [];
      const sourceType = app.source_type || 'play_store';

      if (sourceType === 'play_store' || sourceType === 'both') {
        sources.push({
          type: 'play_store',
          name: 'Google Play Store',
          url: `https://play.google.com/store/apps/details?id=${appId}`,
          icon: '▶️'
        });
      }

      if ((sourceType === 'both' || sourceType === 'hosted') && app.source_url) {
        if (sourceType === 'both') {
          try {
            const parsed = JSON.parse(app.source_url);
            if (parsed && parsed.hosted) {
              sources.push({
                type: 'hosted',
                name: 'Direct Download',
                url: parsed.hosted,
                icon: '📥'
              });
            }
          } catch (e) {
            console.warn('Parse error:', e);
          }
        } else {
          sources.push({
            type: 'hosted',
            name: 'Direct Download',
            url: app.source_url,
            icon: '📥'
          });
        }
      }

      if (sourceType === 'external' && app.source_url) {
        const name = this.getExternalSourceName(app.source_url);
        const icon = this.getExternalSourceIcon(app.source_url);
        sources.push({
          type: 'external',
          name: name,
          url: app.source_url,
          icon: icon
        });
      }

      return sources;
    } catch (error) {
      console.error('Error getting sources:', error);
      return [];
    }
  }
}

// ============ INITIALIZE ============
try {
  window.DownloadSourcesManager = DownloadSourcesManager;
  console.log('✅ Download Sources Manager Loaded');
} catch (error) {
  console.error('Failed to load Download Manager:', error);
}
