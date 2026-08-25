/**
 * ⚙️ Settings Page - Complete Logic
 * Appearance + Sound + Data Settings
 * (Language moved to Sidebar)
 */

document.addEventListener("DOMContentLoaded", () => {
  console.log('⚙️ Loading settings...');
  
  refreshNavAuth();
  
  // Direct setup without language (language is in sidebar now)
  setupAppearanceSettings();
  setupSoundSettings();
  setupDataSettings();
});

// ============ APPEARANCE SETTINGS ============

function setupAppearanceSettings() {
  try {
    console.log('🎨 Loading appearance settings...');

    // Accent color
    const savedAccent = localStorage.getItem("mrzn_accent") || "blue";
    document.querySelectorAll(".swatch").forEach(sw => {
      sw.classList.toggle("active", sw.dataset.color === savedAccent);
      sw.addEventListener("click", () => {
        localStorage.setItem("mrzn_accent", sw.dataset.color);
        document.querySelectorAll(".swatch").forEach(s => s.classList.remove("active"));
        sw.classList.add("active");
        applyStoredSettings();
        showToast("✅ Accent color updated!", "success");
      });
    });

    // Font size
    const savedFontSize = localStorage.getItem("mrzn_font_size") || "medium";
    document.querySelectorAll("#font-size-group .seg-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.size === savedFontSize);
      btn.addEventListener("click", () => {
        localStorage.setItem("mrzn_font_size", btn.dataset.size);
        document.querySelectorAll("#font-size-group .seg-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        applyStoredSettings();
        showToast("✅ Font size updated!", "success");
      });
    });

    // Simple toggles
    bindToggle("compact-toggle", "mrzn_compact");
    bindToggle("animation-toggle", "mrzn_animations", true);
    bindToggle("datasaver-toggle", "mrzn_datasaver");

    console.log('✅ Appearance settings loaded');

  } catch (error) {
    console.error('Appearance settings error:', error);
  }
}

// ============ SOUND SETTINGS ============

function setupSoundSettings() {
  try {
    console.log('🔊 Loading sound settings...');

    // Sound toggles
    bindToggle("sound-toggle", "mrzn_sound_enabled", true);
    bindToggle("voice-toggle", "mrzn_voice_enabled", true);

    console.log('✅ Sound settings loaded');

  } catch (error) {
    console.error('Sound settings error:', error);
  }
}

// ============ DATA SETTINGS ============

function setupDataSettings() {
  try {
    console.log('📊 Loading data settings...');

    // Recently viewed
    const recent = JSON.parse(localStorage.getItem("mrzn_recently_viewed") || "[]");
    const recentCountEl = document.getElementById("recently-viewed-count");
    if (recentCountEl) {
      recentCountEl.textContent = `${recent.length} apps seen recently`;
    }

    const viewRecentBtn = document.getElementById("view-recent-btn");
    if (viewRecentBtn) {
      viewRecentBtn.addEventListener("click", () => {
        const list = document.getElementById("recently-viewed-list");
        const isOpen = list.style.display === "block";
        list.style.display = isOpen ? "none" : "block";
        
        if (!isOpen) {
          list.innerHTML = recent.length
            ? recent.map(a => `
                <a href="app.html?id=${a.id}" style="display:flex;align-items:center;gap:10px;padding:8px 0;color:inherit;text-decoration:none;">
                  <img src="${escapeHTML(a.icon || 'assets/placeholder-icon.svg')}" style="width:30px;height:30px;border-radius:7px;background:var(--panel-2)">
                  <span style="font-size:13.5px">${escapeHTML(a.name)}</span>
                </a>`).join("")
            : `<div style="color:var(--text-faint);font-size:13px">No apps viewed yet.</div>`;
        }
      });
    }

    // Favorites
    const favorites = JSON.parse(localStorage.getItem("mrzn_favorites") || "[]");
    const favCountEl = document.getElementById("favorites-count");
    if (favCountEl) {
      favCountEl.textContent = `${favorites.length} apps favorited`;
    }

    const viewFavBtn = document.getElementById("view-favorites-btn");
    if (viewFavBtn) {
      viewFavBtn.addEventListener("click", () => {
        const list = document.getElementById("favorites-list");
        const isOpen = list.style.display === "block";
        list.style.display = isOpen ? "none" : "block";
        
        if (!isOpen) {
          list.innerHTML = favorites.length
            ? favorites.map(a => `
                <a href="app.html?id=${a.id}" style="display:flex;align-items:center;gap:10px;padding:8px 0;color:inherit;text-decoration:none;">
                  <img src="${escapeHTML(a.icon || 'assets/placeholder-icon.svg')}" style="width:30px;height:30px;border-radius:7px;background:var(--panel-2)">
                  <span style="font-size:13.5px">${escapeHTML(a.name)}</span>
                </a>`).join("")
            : `<div style="color:var(--text-faint);font-size:13px">No favorites yet.</div>`;
        }
      });
    }

    // Request an app shortcut
    const openReqBtn = document.getElementById("open-request-btn");
    if (openReqBtn) {
      openReqBtn.addEventListener("click", () => {
        window.openAppRequestModal?.();
      });
    }

    // Reset to defaults
    const resetBtn = document.getElementById("reset-defaults-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        if (!confirm("Reset appearance and sound settings to default? Your favorites and history will be kept.")) return;
        ["mrzn_accent", "mrzn_font_size", "mrzn_compact", "mrzn_animations", "mrzn_datasaver",
         "mrzn_sound_enabled", "mrzn_voice_enabled"].forEach(k => localStorage.removeItem(k));
        showToast("✅ Settings reset! Reloading...", "success");
        setTimeout(() => window.location.reload(), 1000);
      });
    }

    // Clear cache
    const clearBtn = document.getElementById("clear-cache-btn");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        if (!confirm("This will reset all your site preferences. Continue?")) return;
        ["mrzn_accent", "mrzn_font_size", "mrzn_compact", "mrzn_animations", "mrzn_datasaver",
         "mrzn_sound_enabled", "mrzn_voice_enabled", "mrzn_recently_viewed", "mrzn_favorites", "mrzn_language"].forEach(k => localStorage.removeItem(k));
        showToast("✅ Cache cleared! Reloading...", "success");
        setTimeout(() => window.location.reload(), 1000);
      });
    }

    // Share button
    const shareBtn = document.getElementById("share-btn");
    if (shareBtn) {
      shareBtn.addEventListener("click", async () => {
        const shareData = {
          title: "MRZN Apps & Games",
          text: "Check out MRZN Apps & Games — discover apps, games, and AI tools!",
          url: window.location.origin + window.location.pathname.replace("settings.html", "index.html")
        };
        
        if (navigator.share) {
          try { 
            await navigator.share(shareData);
          } catch (e) { 
            // User cancelled
          }
        } else {
          navigator.clipboard?.writeText(shareData.url);
          showToast("✅ Link copied to clipboard!", "success");
        }
      });
    }

    console.log('✅ Data settings loaded');

  } catch (error) {
    console.error('Data settings error:', error);
  }
}

// ============ HELPER FUNCTIONS ============

function bindToggle(id, key, invertedOnMeansOn = false) {
  try {
    const el = document.getElementById(id);
    if (!el) return;
    
    const stored = localStorage.getItem(key);
    if (invertedOnMeansOn) {
      el.checked = stored !== "off";
    } else {
      el.checked = stored === "on";
    }
    
    el.addEventListener("change", () => {
      localStorage.setItem(key, el.checked ? "on" : "off");
      applyStoredSettings();
    });
  } catch (error) {
    console.error('Bind toggle error:', error);
  }
}

function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
