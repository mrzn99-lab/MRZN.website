
document.addEventListener("DOMContentLoaded", async () => {
  const navContainer = document.querySelector(".navbar .container");
  if (!navContainer) return;

  // ---------- Hamburger button ----------
  const hamburger = document.createElement("button");
  hamburger.id = "sidebar-toggle";
  hamburger.setAttribute("aria-label", "Open menu");
  hamburger.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
  hamburger.style.cssText = "color:var(--text);margin-right:12px;flex-shrink:0;cursor:pointer;border:none;background:none";
  navContainer.insertBefore(hamburger, navContainer.firstChild);

  // Get auth info
  let session = null;
  let isAdmin = false;
  try {
    const { data: authData } = await window.supabaseClient.auth.getSession();
    session = authData?.session;
    
    if (session) {
      try {
        const { data: profile } = await window.supabaseClient
          .from("profiles")
          .select("is_admin")
          .eq("id", session.user.id)
          .single();
        isAdmin = profile?.is_admin || false;
      } catch (error) {
        console.warn('Profile check error:', error);
      }
    }
  } catch (error) {
    console.warn('Auth check error:', error);
  }

  // ---------- Sidebar + overlay ----------
  const overlay = document.createElement("div");
  overlay.id = "sidebar-overlay";
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:400;display:none";

  const sidebar = document.createElement("aside");
  sidebar.id = "sidebar-panel";
  sidebar.style.cssText = `
    position:fixed; top:0; left:0; bottom:0; width:270px; max-width:80vw;
    background:var(--panel); border-right:1px solid var(--line);
    z-index:401; transform:translateX(-100%); transition:transform .25s ease;
    display:flex; flex-direction:column; padding:20px 0;
  `;

  sidebar.innerHTML = `
    <div style="padding:0 20px 18px;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:10px">
      <img src="assets/logo.png" style="width:32px;height:32px;border-radius:8px;object-fit:cover">
      <span style="font-family:var(--f-display);font-weight:700;font-size:15px">MRZN <span style="color:var(--cyan)">Apps & Games</span></span>
    </div>
    <div style="flex:1;overflow-y:auto;padding:14px 10px">
      ${sidebarLink("index.html", "🏠", "Home")}
      ${sidebarLink("index.html#apps", "📱", "Browse Apps")}
      ${sidebarLink("profile.html", "👤", "Profile")}
      
      <!-- Settings & Language Section -->
      <div style="height:1px;background:var(--line);margin:10px;"></div>
      
      ${sidebarLink("settings.html", "⚙️", "Settings")}
      ${sidebarLink("#", "📰", "Updates", "sidebar-updates")}
      ${isAdmin ? sidebarLink("admin.html", "🛠️", "Admin Panel") : ""}
      
      <!-- Language Selector -->
      <div style="padding: 12px; margin: 8px 0; background: rgba(0, 229, 255, 0.05); border-radius: 6px; border-left: 3px solid var(--cyan);">
        <label style="
          display: block;
          font-weight: 600;
          font-size: 12px;
          color: var(--text);
          margin-bottom: 8px;
        ">🌍 Language</label>
        
        <select id="sidebar-language-select" style="
          width: 100%;
          padding: 8px;
          border: 1px solid var(--line);
          border-radius: 4px;
          background: var(--void);
          color: var(--text);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
        ">
          <!-- Options will be populated by JavaScript -->
        </select>
      </div>
      
      <div style="height:1px;background:var(--line);margin:14px 10px"></div>
      ${sidebarLink("#", "📝", "Request an App", "sidebar-request-app")}
      <a href="https://youtube.com/@mrznapps_games?si=fKnK3nBYOeyRThQA" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:8px;color:var(--text-dim);font-family:var(--f-ui);font-size:14px">📺 YouTube</a>
      ${sidebarLink("#", "📤", "Share Website", "sidebar-share")}
    </div>
    <div style="padding:14px 20px 0;border-top:1px solid var(--line)">
      <div id="sidebar-auth-slot" style="font-family:var(--f-mono);font-size:11.5px;color:var(--text-faint)"></div>
    </div>
  `;

  function sidebarLink(href, icon, label, id) {
    return `<a href="${href}" ${id ? `id="${id}"` : ""} style="display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:8px;color:var(--text);font-family:var(--f-ui);font-weight:600;font-size:14px;margin-bottom:2px;cursor:pointer;text-decoration:none;">
      <span>${icon}</span><span>${label}</span>
    </a>`;
  }

  document.body.appendChild(overlay);
  document.body.appendChild(sidebar);

  function openSidebar() {
    sidebar.style.transform = "translateX(0)";
    overlay.style.display = "block";
  }
  function closeSidebar() {
    sidebar.style.transform = "translateX(-100%)";
    overlay.style.display = "none";
  }

  hamburger.addEventListener("click", openSidebar);
  overlay.addEventListener("click", closeSidebar);
  sidebar.querySelectorAll("a").forEach(a => {
    if (a.id !== "sidebar-request-app" && a.id !== "sidebar-share" && a.id !== "sidebar-updates") {
      a.addEventListener("click", closeSidebar);
    }
  });

  // Auth footer
  const authSlot = document.getElementById("sidebar-auth-slot");
  if (session) {
    authSlot.textContent = `Signed in as ${session.user.email}`;
  } else {
    authSlot.innerHTML = `<a href="login.html" style="color:var(--cyan)">Log in</a>`;
  }

  // Share button
  document.getElementById("sidebar-share")?.addEventListener("click", async (e) => {
    e.preventDefault();
    const shareData = {
      title: "MRZN Apps & Games",
      text: "Check out MRZN Apps & Games — apps, games, and reviews!",
      url: window.location.origin + window.location.pathname.replace(/[^/]+$/, "index.html")
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (e2) {}
    } else {
      navigator.clipboard?.writeText(shareData.url);
      showToast?.("Link copied!", "success");
    }
    closeSidebar();
  });

  // Request app
  document.getElementById("sidebar-request-app")?.addEventListener("click", (e) => {
    e.preventDefault();
    closeSidebar();
    window.openAppRequestModal?.();
  });

  // ============ LANGUAGE SELECTOR IN SIDEBAR ============

  async function initLanguageSelector() {
    try {
      if (!window.languageManager) {
        console.warn('Language manager not ready');
        return;
      }

      const languages = window.languageManager.getLanguages();
      const select = document.getElementById('sidebar-language-select');

      if (!select) return;

      // Build options
      let optionsHTML = '';
      for (const [code, name] of Object.entries(languages)) {
        const selected = window.languageManager.currentLang === code ? 'selected' : '';
        optionsHTML += `<option value="${code}" ${selected}>${name}</option>`;
      }

      select.innerHTML = optionsHTML;

      // Change language event
      select.addEventListener('change', async (e) => {
        const langCode = e.target.value;
        console.log('🌍 Changing to:', langCode);
        
        try {
          await window.languageManager.changeLanguage(langCode);
          showToast?.(`✅ Language changed to ${window.languageManager.getLanguageName(langCode)}`, 'success');
        } catch (error) {
          console.error('Language change error:', error);
          showToast?.('❌ Error changing language', 'error');
        }
      });

      console.log('✅ Language selector initialized');
    } catch (error) {
      console.error('Language selector error:', error);
    }
  }

  // Wait for language manager
  const checkLangManager = setInterval(() => {
    if (window.languageManager) {
      clearInterval(checkLangManager);
      initLanguageSelector();
    }
  }, 100);

  // ============ UPDATES PANEL ============

  const updatesPanel = document.createElement("div");
  updatesPanel.id = "updates-panel";
  updatesPanel.style.cssText = `
    position: fixed;
    top: 0;
    right: -400px;
    bottom: 0;
    width: 380px;
    max-width: 90vw;
    background: var(--panel);
    border-left: 1px solid var(--line);
    z-index: 400;
    transition: right 0.3s ease;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `;

  updatesPanel.innerHTML = `
    <div style="padding: 18px 20px; border-bottom: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
      <div style="font-weight: 700; font-size: 18px; color: var(--cyan);">📰 Updates</div>
      <button id="updates-panel-close" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-dim);">✕</button>
    </div>
    <div id="updates-list-container" style="flex: 1; overflow-y: auto; padding: 20px;">
      <div style="text-align: center; color: var(--text-dim);">⏳ Loading updates...</div>
    </div>
  `;

  document.body.appendChild(updatesPanel);

  // Updates toggle
  document.getElementById("sidebar-updates").addEventListener("click", async (e) => {
    e.preventDefault();
    closeSidebar();
    updatesPanel.style.right = updatesPanel.style.right === "0px" ? "-400px" : "0px";
    if (updatesPanel.style.right === "0px") {
      await loadUpdatesPanel();
    }
  });

  // Close updates panel
  document.getElementById("updates-panel-close").addEventListener("click", () => {
    updatesPanel.style.right = "-400px";
  });

  // Load updates
  async function loadUpdatesPanel() {
    try {
      if (!window.supabaseClient) {
        document.getElementById("updates-list-container").innerHTML = '<div style="color: red;">Database not connected</div>';
        return;
      }

      const { data, error } = await window.supabaseClient
        .from('website_updates')
        .select('*')
        .eq('status', 'published')
        .order('published_date', { ascending: false });

      const container = document.getElementById('updates-list-container');

      if (error || !data || data.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: var(--text-dim); padding: 40px 20px;">No updates yet</div>';
        return;
      }

      container.innerHTML = data.map(u => `
        <div style="
          background: rgba(0, 229, 255, 0.08);
          border: 1px solid rgba(0, 229, 255, 0.2);
          border-radius: 10px;
          padding: 14px;
          margin-bottom: 12px;
        ">
          ${u.image_url ? `
            <img src="${u.image_url}" alt="Update" style="
              width: 100%;
              height: 160px;
              object-fit: cover;
              border-radius: 6px;
              margin-bottom: 10px;
            " onerror="this.style.display='none'">
          ` : ''}
          
          <div style="font-weight: 700; color: var(--cyan); font-size: 15px; margin-bottom: 6px;">
            ${u.title || 'Update'}
          </div>
          
          <div style="
            font-size: 13px;
            color: var(--text-dim);
            line-height: 1.4;
            margin-bottom: 8px;
          ">
            ${u.description?.substring(0, 100) || 'N/A'}
          </div>
          
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            color: var(--text-faint);
            border-top: 1px solid rgba(0, 229, 255, 0.1);
            padding-top: 8px;
          ">
            <span>📅 ${new Date(u.published_date).toLocaleDateString()}</span>
            ${u.version ? `
              <span style="
                background: var(--cyan);
                color: var(--void);
                padding: 3px 8px;
                border-radius: 3px;
                font-weight: 700;
              ">${u.version}</span>
            ` : ''}
          </div>
        </div>
      `).join('');

    } catch (error) {
      console.error('Updates error:', error);
      document.getElementById('updates-list-container').innerHTML = '<div style="color: red;">Error loading updates</div>';
    }
  }
});
