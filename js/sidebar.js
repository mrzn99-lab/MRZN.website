/* ===================================================================
   MRZN SIDEBAR MENU
   Injects a hamburger button + off-canvas sidebar into every page
   that includes this script. Consolidates navigation in one place.
   =================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  const navContainer = document.querySelector(".navbar .container");
  if (!navContainer) return;

  // ---------- Hamburger button ----------
  const hamburger = document.createElement("button");
  hamburger.id = "sidebar-toggle";
  hamburger.setAttribute("aria-label", "Open menu");
  hamburger.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
  hamburger.style.cssText = "color:var(--text);margin-right:12px;flex-shrink:0";
  navContainer.insertBefore(hamburger, navContainer.firstChild);

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

  const { data: { session } } = await supabaseClient.auth.getSession();
  let isAdmin = false;
  if (session) {
    const { data: profile } = await supabaseClient.from("profiles").select("is_admin").eq("id", session.user.id).single();
    isAdmin = profile?.is_admin || ADMIN_EMAILS.includes(session.user.email);
  }

  sidebar.innerHTML = `
    <div style="padding:0 20px 18px;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:10px">
      <img src="assets/logo.png" style="width:32px;height:32px;border-radius:8px;object-fit:cover">
      <span style="font-family:var(--f-display);font-weight:700;font-size:15px">MRZN <span style="color:var(--cyan)">Apps & Games</span></span>
    </div>
    <div style="flex:1;overflow-y:auto;padding:14px 10px">
      ${sidebarLink("index.html", "🏠", "Home")}
      ${sidebarLink("index.html#apps", "📱", "Browse Apps")}
      ${sidebarLink("profile.html", "👤", "Profile")}
      ${sidebarLink("settings.html", "⚙️", "Settings")}
      ${sidebarLink("#", "📝", "Request an App", "sidebar-request-app")}
      ${isAdmin ? sidebarLink("admin.html", "🛠️", "Admin Panel") : ""}
      <div style="height:1px;background:var(--line);margin:14px 10px"></div>
      <a href="https://youtube.com/@mrznapps_games?si=fKnK3nBYOeyRThQA" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:8px;color:var(--text-dim);font-family:var(--f-ui);font-size:14px">📺 YouTube</a>
      ${sidebarLink("#", "📤", "Share Website", "sidebar-share")}
    </div>
    <div style="padding:14px 20px 0;border-top:1px solid var(--line)">
      <div id="sidebar-auth-slot" style="font-family:var(--f-mono);font-size:11.5px;color:var(--text-faint)"></div>
    </div>
  `;

  function sidebarLink(href, icon, label, id) {
    return `<a href="${href}" ${id ? `id="${id}"` : ""} style="display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:8px;color:var(--text);font-family:var(--f-ui);font-weight:600;font-size:14px;margin-bottom:2px">
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
    if (a.id !== "sidebar-request-app" && a.id !== "sidebar-share") {
      a.addEventListener("click", closeSidebar);
    }
  });

  // auth footer in sidebar
  const authSlot = document.getElementById("sidebar-auth-slot");
  if (session) {
    authSlot.textContent = `Signed in as ${session.user.email}`;
  } else {
    authSlot.innerHTML = `<a href="login.html" style="color:var(--cyan)">Log in</a>`;
  }

  // share button in sidebar
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
      showToast("Link copied to clipboard!", "success");
    }
    closeSidebar();
  });

  // request-an-app link opens the shared modal (defined in app-request.js)
  document.getElementById("sidebar-request-app")?.addEventListener("click", (e) => {
    e.preventDefault();
    closeSidebar();
    window.openAppRequestModal?.();
  });
});
    
