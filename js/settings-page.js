/* ===================== SETTINGS PAGE LOGIC ===================== */

document.addEventListener("DOMContentLoaded", () => {
  refreshNavAuth();

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
                       
