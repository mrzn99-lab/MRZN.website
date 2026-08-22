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

  static SOURCE_ICONS = {
    play_store: '▶️',
    hosted: '📥',
    external: '🔗',
    fdroid: '🔓',
    uptodown: '📱',
    softonic: '💿',
    apkpure: '🔑',
    apkmirror: '🪞'
  };

  /**
   * Get user-friendly source name
   */
  static getSourceName(sourceType) {
    const names = {
      play_store: 'Google Play Store',
      hosted: 'Direct Download',
      external: 'Third Party',
      both: 'Multiple Sources'
    };
    return names[sourceType] || 'Unknown';
  }

  /**
   * Get badge HTML for source type
   */
  static getSourceBadge(sourceType) {
    const badges = {
      play_store: '🏪 Play Store',
      hosted: '📥 Hosted',
      external: '🔗 External',
      both: '📦 Multiple'
    };
    return badges[sourceType] || '❓ Unknown';
  }

  /**
   * Parse external source URL and get provider name
   */
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

  /**
   * Display download sources in UI
   */
  static async displayDownloadSources(appId) {
    try {
      if (!window.supabaseClient) {
        console.warn('Supabase not ready');
        return;
      }

      const { data: app } = await window.supabaseClient
        .from('apps')
        .select('id, name, source_type, source_url, apk_size_mb, min_android_version')
        .eq('id', appId)
        .single();

      if (!app) return;

      const container = document.getElementById('download-sources');
      if (!container) return;

      let html = '';
      const sourceType = app.source_type || 'play_store';

      // ============ PLAY STORE SOURCE ============
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

      // ============ HOSTED SOURCE (for 'both') ============
      if (sourceType === 'both' && app.source_url) {
        try {
          const sources = JSON.parse(app.source_url);
          if (sources.hosted) {
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
          console.error('Error parsing source URLs:', e);
        }
      }
      // ============ DIRECT HOSTED SOURCE ============
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
      // ============ EXTERNAL SOURCE ============
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

        // Show warning for external sources
        const warningBox = document.getElementById('source-warning');
        if (warningBox) {
          warningBox.style.display = 'block';
          document.getElementById('warning-text').textContent = 
            `This app is hosted on ${externalName}. Download at your own risk and verify file integrity.`;
        }
      }

      // ============ APP INFO ============
      if (app.apk_size_mb || app.min_android_version) {
        const info = [];
        if (app.apk_size_mb) info.push(`📦 ${app.apk_size_mb}MB`);
        if (app.min_android_version) info.push(`📱 Android ${app.min_android_version}+`);

        if (info.length > 0) {
          html += `
            <div style="grid-column: 1 / -1; font-size: 12px; color: var(--text-faint); text-align: center; margin-top: 8px; padding: 12px; background: rgba(8, 145, 178, 0.05); border-radius: 6px;">
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

  /**
   * Get icon for external source
   */
  static getExternalSourceIcon(url) {
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

  /**
   * Create download source card HTML
   */
  static createSourceCard(sourceType, url, appId) {
    const name = this.getSourceName(sourceType);
    const icon = this.SOURCE_ICONS[sourceType] || '📦';
    const downloadUrl = sourceType === 'play_store' 
      ? `https://play.google.com/store/apps/details?id=${appId}`
      : url;

    return `
      <div class="download-option" onclick="window.open('${downloadUrl}', '_blank')">
        <div class="download-option-icon">${icon}</div>
        <div class="download-option-name">${name}</div>
        <div class="download-option-meta">${sourceType === 'play_store' ? 'Official' : 'Alternative'}</div>
        <button class="btn-download">Download</button>
      </div>
    `;
  }

  /**
   * Get all available sources for an app
   */
  static async getAvailableSources(appId) {
    try {
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
            if (parsed.hosted) {
              sources.push({
                type: 'hosted',
                name: 'Direct Download',
                url: parsed.hosted,
                icon: '📥'
              });
            }
          } catch (e) {
            console.error('Error parsing source URLs', e);
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
      console.error('Error getting available sources:', error);
      return [];
    }
  }
}

// ============ INITIALIZE ============
console.log('✅ Download Sources Manager Loaded');
window.DownloadSourcesManager = DownloadSourcesManager;
