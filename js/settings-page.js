/* ===================== SETTINGS PAGE LOGIC ===================== */

document.addEventListener("DOMContentLoaded", () => {
  refreshNavAuth();

  /**
 * ⚙️ Settings Page - Language Selector Added
 */

// Line 5: Find or create language section in settings

async function loadLanguageSettings() {
  try {
    console.log('🌍 Loading language settings...');

    if (!window.languageManager) {
      console.warn('Language manager not ready');
      return;
    }

    // Line 15: Create language settings panel
    const settingsPanel = document.querySelector('.settings-section') || 
                         document.querySelector('.panel');

    if (!settingsPanel) {
      console.warn('Settings panel not found');
      return;
    }

    // Line 23: Check if already created
    if (document.getElementById('language-settings-section')) {
      return;
    }

    // Line 27: Create language section
    const langSection = document.createElement('div');
    langSection.id = 'language-settings-section';
    langSection.className = 'panel settings-section';
    langSection.style.marginTop = '20px';

    const languages = window.languageManager.getLanguages();

    // Line 36: Build language options
    let langOptionsHTML = '';
    for (const [code, name] of Object.entries(languages)) {
      const selected = window.languageManager.currentLang === code ? 'selected' : '';
      langOptionsHTML += `<option value="${code}" ${selected}>${name}</option>`;
    }

    langSection.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h3 style="margin-bottom: 15px; font-size: 18px; font-weight: 700;">🌍 Language Settings</h3>
        
        <div style="background: rgba(0, 229, 255, 0.05); padding: 12px; border-radius: 6px; margin-bottom: 15px;">
          <label style="
            display: block;
            margin-bottom: 10px;
            font-weight: 600;
            font-size: 14px;
          ">Select Language (100+ languages available)</label>
          
          <select id="language-select" style="
            width: 100%;
            padding: 12px;
            border: 1px solid var(--line);
            border-radius: 6px;
            background: var(--void);
            color: var(--text);
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
          ">
            ${langOptionsHTML}
          </select>

          <small style="display: block; margin-top: 10px; color: var(--text-faint);">
            ✅ Changes apply instantly to entire website
          </small>
        </div>

        <div id="language-status" style="
          padding: 10px;
          border-radius: 6px;
          text-align: center;
          font-size: 13px;
          display: none;
        "></div>

        <div style="
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.3);
          padding: 12px;
          border-radius: 6px;
          margin-top: 15px;
          font-size: 13px;
          line-height: 1.5;
        ">
          <strong>💡 Tip:</strong> Your language preference is saved locally. It will be remembered when you visit again.
        </div>
      </div>
    `;

    // Line 94: Insert into settings
    const settingsContainer = document.querySelector('[id*="settings"]') || 
                             document.querySelector('.settings-container') ||
                             document.body;

    if (settingsContainer.querySelector('h2:first-of-type')) {
      settingsContainer.querySelector('h2:first-of-type').parentNode.insertBefore(
        langSection,
        settingsContainer.querySelector('h2:first-of-type').nextSibling
      );
    } else {
      settingsContainer.insertBefore(langSection, settingsContainer.firstChild);
    }

    // Line 108: Event listener
    document.getElementById('language-select').addEventListener('change', async (e) => {
      const langCode = e.target.value;
      const status = document.getElementById('language-status');

      status.style.display = 'block';
      status.style.background = 'rgba(0, 229, 255, 0.1)';
      status.style.color = 'var(--cyan)';
      status.textContent = '🔄 Changing language...';

      try {
        await window.languageManager.changeLanguage(langCode);
        
        status.style.background = 'rgba(34, 197, 94, 0.1)';
        status.style.color = '#86efac';
        status.textContent = '✅ Language changed to ' + window.languageManager.getLanguageName(langCode);
        
        setTimeout(() => {
          status.style.display = 'none';
        }, 2000);
      } catch (error) {
        status.style.background = 'rgba(220, 38, 38, 0.1)';
        status.style.color = '#fca5a5';
        status.textContent = '❌ Error: ' + error.message;
      }
    });

    console.log('✅ Language settings loaded');

  } catch (error) {
    console.error('Language settings error:', error);
  }
}

// Line 147: Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadLanguageSettings);
} else {
  loadLanguageSettings();
                                                                }
  // ---------- Accent color ----------
  const savedAccent = localStorage.getItem("mrzn_accent") || "blue";
  document.querySelectorAll(".swatch").forEach(sw => {
    sw.classList.toggle("active", sw.dataset.color === savedAccent);
    sw.addEventListener("click", () => {
      localStorage.setItem("mrzn_accent", sw.dataset.color);
      document.querySelectorAll(".swatch").forEach(s => s.classList.remove("active"));
      sw.classList.add("active");
      applyStoredSettings();
      showToast("Accent color updated!", "success");
    });
  });

  // ---------- Font size ----------
  const savedFontSize = localStorage.getItem("mrzn_font_size") || "medium";
  document.querySelectorAll("#font-size-group .seg-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.size === savedFontSize);
    btn.addEventListener("click", () => {
      localStorage.setItem("mrzn_font_size", btn.dataset.size);
      document.querySelectorAll("#font-size-group .seg-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      applyStoredSettings();
    });
  });

  // ---------- Simple toggles ----------
  bindToggle("compact-toggle", "mrzn_compact");
  bindToggle("animation-toggle", "mrzn_animations", true); // inverted: checked = animations ON
  bindToggle("datasaver-toggle", "mrzn_datasaver");
  bindToggle("sound-toggle", "mrzn_sound_enabled", true); // checked = sound ON
  bindToggle("voice-toggle", "mrzn_voice_enabled", true); // checked = voice ON

  function bindToggle(id, key, invertedOnMeansOn = false) {
    const el = document.getElementById(id);
    if (!el) return;
    const stored = localStorage.getItem(key);
    if (invertedOnMeansOn) {
      el.checked = stored !== "off"; // default true unless explicitly "off"
    } else {
      el.checked = stored === "on";
    }
    el.addEventListener("change", () => {
      if (invertedOnMeansOn) {
        localStorage.setItem(key, el.checked ? "on" : "off");
      } else {
        localStorage.setItem(key, el.checked ? "on" : "off");
      }
      applyStoredSettings();
    });
  }

  // ---------- Recently viewed ----------
  const recent = JSON.parse(localStorage.getItem("mrzn_recently_viewed") || "[]");
  document.getElementById("recently-viewed-count").textContent = `${recent.length} apps seen recently`;

  document.getElementById("view-recent-btn").addEventListener("click", () => {
    const list = document.getElementById("recently-viewed-list");
    const isOpen = list.style.display === "block";
    list.style.display = isOpen ? "none" : "block";
    if (!isOpen) {
      list.innerHTML = recent.length
        ? recent.map(a => `
            <a href="app.html?id=${a.id}" style="display:flex;align-items:center;gap:10px;padding:8px 0;color:inherit">
              <img src="${escapeHTML(a.icon || 'assets/placeholder-icon.svg')}" style="width:30px;height:30px;border-radius:7px;background:var(--panel-2)">
              <span style="font-size:13.5px">${escapeHTML(a.name)}</span>
            </a>`).join("")
        : `<div style="color:var(--text-faint);font-size:13px">No apps viewed yet.</div>`;
    }
  });

  // ---------- Favorites ----------
  const favorites = JSON.parse(localStorage.getItem("mrzn_favorites") || "[]");
  document.getElementById("favorites-count").textContent = `${favorites.length} apps favorited`;

  document.getElementById("view-favorites-btn").addEventListener("click", () => {
    const list = document.getElementById("favorites-list");
    const isOpen = list.style.display === "block";
    list.style.display = isOpen ? "none" : "block";
    if (!isOpen) {
      list.innerHTML = favorites.length
        ? favorites.map(a => `
            <a href="app.html?id=${a.id}" style="display:flex;align-items:center;gap:10px;padding:8px 0;color:inherit">
              <img src="${escapeHTML(a.icon || 'assets/placeholder-icon.svg')}" style="width:30px;height:30px;border-radius:7px;background:var(--panel-2)">
              <span style="font-size:13.5px">${escapeHTML(a.name)}</span>
            </a>`).join("")
        : `<div style="color:var(--text-faint);font-size:13px">No favorites yet.</div>`;
    }
  });

  // ---------- Request an app (shortcut) ----------
  document.getElementById("open-request-btn").addEventListener("click", () => {
    window.openAppRequestModal?.();
  });

  // ---------- Reset to defaults (keeps favorites/recently viewed) ----------
  document.getElementById("reset-defaults-btn").addEventListener("click", () => {
    if (!confirm("Reset appearance and sound settings to default? Your favorites and history will be kept.")) return;
    ["mrzn_accent", "mrzn_font_size", "mrzn_compact", "mrzn_animations", "mrzn_datasaver",
     "mrzn_sound_enabled", "mrzn_voice_enabled"].forEach(k => localStorage.removeItem(k));
    showToast("Settings reset! Reloading...", "success");
    setTimeout(() => window.location.reload(), 1000);
  });

  // ---------- Clear cache ----------
  document.getElementById("clear-cache-btn").addEventListener("click", () => {
    if (!confirm("This will reset all your site preferences (theme, font size, recently viewed, etc). Continue?")) return;
    ["mrzn_accent", "mrzn_font_size", "mrzn_compact", "mrzn_animations", "mrzn_datasaver",
     "mrzn_sound_enabled", "mrzn_voice_enabled", "mrzn_recently_viewed"].forEach(k => localStorage.removeItem(k));
    showToast("Cache cleared! Reloading...", "success");
    setTimeout(() => window.location.reload(), 1000);
  });

  // ---------- Share ----------
  document.getElementById("share-btn").addEventListener("click", async () => {
    const shareData = {
      title: "MRZN Apps & Games",
      text: "Check out MRZN Apps & Games — apps, games, and reviews!",
      url: window.location.origin + window.location.pathname.replace("settings.html", "index.html")
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (e) { /* user cancelled */ }
    } else {
      navigator.clipboard?.writeText(shareData.url);
      showToast("Link copied to clipboard!", "success");
    }
  });
});
