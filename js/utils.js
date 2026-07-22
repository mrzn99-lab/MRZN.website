/* ===================== SHARED UTILITIES ===================== */

// Global error catcher — surfaces any hidden JS error on-screen so it's
// never silently stuck. Remove this once the site is fully stable.
window.addEventListener("error", (e) => {
  console.error("Uncaught error:", e.error || e.message);
  showDebugError(`JS Error: ${e.message} (${e.filename?.split("/").pop()}:${e.lineno})`);
});
window.addEventListener("unhandledrejection", (e) => {
  console.error("Unhandled promise rejection:", e.reason);
  showDebugError(`Promise error: ${e.reason?.message || e.reason}`);
});

function showDebugError(msg) {
  let box = document.getElementById("debug-error-box");
  if (!box) {
    box = document.createElement("div");
    box.id = "debug-error-box";
    box.style.cssText = `
      position:fixed; top:0; left:0; right:0; z-index:9999;
      background:#ff4d6d; color:#fff; font-family:monospace; font-size:12px;
      padding:10px 14px; max-height:40vh; overflow-y:auto; white-space:pre-wrap;
    `;
    document.body.appendChild(box);
  }
  const line = document.createElement("div");
  line.style.cssText = "border-top:1px solid rgba(255,255,255,0.3); padding-top:6px; margin-top:6px";
  line.textContent = msg;
  box.appendChild(line);
}

function showToast(msg, type = "info") {
  let toast = document.getElementById("global-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "global-toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.borderColor = type === "error" ? "var(--danger)" : type === "success" ? "var(--green)" : "var(--cyan)";
  toast.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove("show"), 3200);
}

function starsHTML(rating, size = 14) {
  const full = Math.round(rating);
  let html = '<span class="stars" style="font-size:' + size + 'px">';
  for (let i = 1; i <= 5; i++) {
    html += i <= full ? "★" : "☆";
  }
  html += "</span>";
  return html;
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return Math.floor(diff / 60) + " min ago";
  if (diff < 86400) return Math.floor(diff / 3600) + " hr ago";
  if (diff < 2592000) return Math.floor(diff / 86400) + " days ago";
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function initials(name) {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join("");
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

function qs(param) {
  return new URLSearchParams(window.location.search).get(param);
}

// boot sequence animation used on the homepage hero
function runBootLog(elId, lines, done) {
  const el = document.getElementById(elId);
  if (!el) return done && done();
  let i = 0, text = "";
  el.innerHTML = '<span class="cursor"></span>';
  function typeLine() {
    if (i >= lines.length) {
      el.querySelector(".cursor")?.remove();
      done && done();
      return;
    }
    text += (i > 0 ? "\n" : "") + lines[i];
    el.innerHTML = escapeHTML(text) + '<span class="cursor"></span>';
    i++;
    setTimeout(typeLine, 220);
  }
  typeLine();
}

// updates the nav bar auth state (login button vs avatar) on every page
async function refreshNavAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  const slot = document.getElementById("nav-auth-slot");
  if (!slot) return;

  if (!session) {
    slot.innerHTML = `<a href="login.html" class="btn btn-primary btn-sm">Log In</a>`;
    return;
  }

  const user = session.user;
  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("username, is_admin")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.is_admin || ADMIN_EMAILS.includes(user.email);
  const name = profile?.username || user.email.split("@")[0];

  slot.innerHTML = `
    ${isAdmin ? '<a href="admin.html" class="btn-ghost btn btn-sm">Admin</a>' : ""}
    <a href="profile.html" class="nav-icon-btn" title="${escapeHTML(name)}">${initials(name)}</a>
  `;
}

async function requireAuth(redirectTo = "login.html") {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = redirectTo;
    return null;
  }
  return session;
}
