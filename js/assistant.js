/* ===================================================================
   MRZN ASSISTANT — rule-based, multilingual-keyword, fuzzy-matching
   website helper. Runs entirely client-side, no paid API, no cost.

   HONEST LIMITS (read this):
   - This is NOT a true AI language model. It cannot understand any
     arbitrary sentence in any language the way ChatGPT does.
   - It recognizes greetings/site-questions via keyword lists in
     English, Bangla, and Banglish (a few common Hindi greetings too),
     and does fuzzy + weighted search across your Supabase `apps`
     table (name > category > description > developer_note > fuzzy).
   - "Did you mean X?" spelling correction works via Levenshtein
     distance against real app names in your database.
   - It won't cover "1000+ questions" out of the box — the knowledge
     base below is a solid starter set; add more patterns to
     KNOWLEDGE_BASE as you notice common questions.
   =================================================================== */

// ---------- SITE KNOWLEDGE (edit these to match your info) ----------
const SITE_INFO = {
  ownerName: "Md Rafiuzzaman",
  websiteName: "MRZN Apps & Games",
  youtube: "https://youtube.com/@mrznapps_games?si=fKnK3nBYOeyRThQA",
  tiktok: "https://vm.tiktok.com/ZS9r8bp4T8YjC-dFSSk/",
};

// ---------- INDEPENDENT APP DATA LOADING ----------
// Don't rely on main.js's timing — fetch our own copy so the assistant
// works correctly even if opened before the homepage finishes loading.
let ASSISTANT_APPS = [];
let ASSISTANT_APPS_READY = false;

async function loadAssistantApps() {
  try {
    const { data, error } = await supabaseClient.from("apps").select("*");
    if (!error && data) {
      ASSISTANT_APPS = data;
      window.ALL_APPS = window.ALL_APPS && window.ALL_APPS.length ? window.ALL_APPS : data;
    }
  } catch (e) {
    console.error("Assistant: could not load apps", e);
  } finally {
    ASSISTANT_APPS_READY = true;
  }
}
loadAssistantApps();

function getAppsForSearch() {
  // prefer whichever list has more data
  const a = window.ALL_APPS || [];
  const b = ASSISTANT_APPS || [];
  return a.length >= b.length ? a : b;
}

// ---------- LEVENSHTEIN DISTANCE (for typo tolerance) ----------
function levenshtein(a, b) {
  a = a.toLowerCase(); b = b.toLowerCase();
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function similarity(a, b) {
  const dist = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length) || 1;
  return 1 - dist / maxLen; // 1 = identical, 0 = completely different
}

// ---------- KNOWLEDGE BASE (greetings + site questions) ----------
// Each entry: array of trigger keywords/phrases (any language/spelling
// variant you want recognized), and a response. Matched by "does the
// message contain any of these" — simple but effective for common cases.
const KNOWLEDGE_BASE = [
  {
    patterns: ["hello", "hi", "hey", "salam", "assalamualaikum", "হ্যালো", "হাই", "হ্যাল"],
    response: () => "Hi! How can I help you? Ask me to find an app, or ask me about this website.",
  },
  {
    patterns: ["how are you", "kemon aso", "kmn aso", "কেমন আছো", "কেমন আছেন", "कैसे हो"],
    response: () => "I'm doing great, thanks for asking! What can I help you find today?",
  },
  {
    patterns: ["good morning", "সুপ্রভাত"],
    response: () => "Good morning! ☀️ How can I help you today?",
  },
  {
    patterns: ["good night", "শুভ রাত্রি"],
    response: () => "Good night! 🌙 Feel free to come back anytime.",
  },
  {
    patterns: ["who are you", "তুমি কে", "আপনি কে", "tumi ke"],
    response: () => "I'm MRZN Assistant — I help you find apps and games on this site.",
  },
  {
    patterns: ["who made this website", "who created this website", "who owns this website", "developer", "creator", "owner", "কে বানিয়েছে", "মালিক কে", "ওয়েবসাইট কে বানিয়েছে"],
    response: () => `This website, ${SITE_INFO.websiteName}, was created by ${SITE_INFO.ownerName}.`,
  },
  {
    patterns: ["what is this website", "এই ওয়েবসাইট কি", "ei website ki"],
    response: () => `${SITE_INFO.websiteName} is a directory where you can browse apps and games, and leave ratings and reviews.`,
  },
  {
    patterns: ["youtube", "ইউটিউব"],
    response: () => `Here's our YouTube channel: ${SITE_INFO.youtube}`,
  },
  {
    patterns: ["tiktok", "টিকটক"],
    response: () => `Here's our TikTok: ${SITE_INFO.tiktok}`,
  },
  {
    patterns: ["thank", "ধন্যবাদ", "dhonnobad"],
    response: () => "You're welcome! 😊",
  },
  {
    patterns: ["bye", "বাই", "বিদায়"],
    response: () => "Bye! Come back anytime you're looking for an app.",
  },
];

function checkKnowledgeBase(text) {
  const lower = text.toLowerCase();
  for (const entry of KNOWLEDGE_BASE) {
    if (entry.patterns.some((p) => lower.includes(p.toLowerCase()))) {
      return entry.response();
    }
  }
  return null;
}

// ---------- WEIGHTED + FUZZY APP SEARCH ----------
// Priority: exact name > category > description/developer_note > fuzzy name match
function searchAppsWeighted(query) {
  const q = query.toLowerCase().trim();
  const apps = getAppsForSearch();
  if (!q) return { exact: [], fuzzy: [] };

  const nameMatches = apps.filter((a) => (a.name || "").toLowerCase().includes(q));
  const categoryMatches = apps.filter((a) => {
    const cat = (a.category || "").toLowerCase();
    return cat.includes(q) || (cat.length > 2 && q.includes(cat));
  });
  const descMatches = apps.filter((a) =>
    (a.description || "").toLowerCase().includes(q) ||
    (a.developer_note || "").toLowerCase().includes(q)
  );

  const seen = new Set();
  const exact = [];
  for (const group of [nameMatches, categoryMatches, descMatches]) {
    for (const app of group) {
      if (!seen.has(app.id)) { seen.add(app.id); exact.push(app); }
    }
  }

  if (exact.length) return { exact: exact.slice(0, 5), fuzzy: [] };

  // no exact matches anywhere -> try fuzzy match against app names (typo tolerance)
  const scored = apps
    .map((a) => ({ app: a, score: similarity(q, (a.name || "").toLowerCase()) }))
    .filter((s) => s.score >= 0.55) // reasonably close spelling
    .sort((a, b) => b.score - a.score);

  return { exact: [], fuzzy: scored.slice(0, 3).map((s) => s.app) };
}

// ---------- CATEGORY/INTENT KEYWORD EXPANSION ----------
const CATEGORY_HINTS = {
  action: ["action", "attack", "attacking", "fight", "fighting", "battle", "shoot", "shooter", "war"],
  puzzle: ["puzzle", "brain", "logic"],
  arcade: ["arcade", "runner", "endless"],
  tools: ["tool", "utility", "productivity"],
  vpn: ["vpn", "proxy", "privacy"],
  social: ["social", "chat", "messaging", "message"],
  photo: ["photo", "camera", "picture", "chobi", "ছবি"],
  video: ["video editor", "video", "movie edit"],
  offline: ["offline game", "offline"],
};

function expandIntent(text) {
  const lower = text.toLowerCase();
  for (const [category, hints] of Object.entries(CATEGORY_HINTS)) {
    if (hints.some((h) => lower.includes(h))) return category;
  }
  return text;
}

// ---------- CHAT STATE ----------
let CHAT_STATE = { awaitingCategory: false };

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("helper-bot-toggle");
  const panel = document.getElementById("helper-bot-panel");
  const closeBtn = document.getElementById("helper-bot-close");
  const input = document.getElementById("helper-bot-input");
  const log = document.getElementById("helper-bot-log");
  const sendBtn = document.getElementById("helper-bot-send");

  if (!toggle || !panel) return;

  toggle.addEventListener("click", () => {
    panel.style.display = "flex";
    input.focus();
  });
  closeBtn?.addEventListener("click", () => {
    panel.style.display = "none";
  });

  function addMessage(html, from) {
    const bubble = document.createElement("div");
    bubble.style.cssText = `
      max-width:80%; margin:7px 0; padding:11px 15px; border-radius:14px;
      font-size:14.5px; line-height:1.6;
      ${from === "bot"
        ? "background:var(--panel-2); color:var(--text); align-self:flex-start; border-bottom-left-radius:3px;"
        : "background:linear-gradient(135deg,var(--cyan),var(--violet)); color:var(--void); align-self:flex-end; margin-left:auto; border-bottom-right-radius:3px;"}
    `;
    bubble.innerHTML = html;
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
  }

  function renderAppList(apps, introText) {
    const list = apps.map((a) =>
      `<a href="app.html?id=${a.id}" style="display:block;color:inherit;text-decoration:underline;margin-top:4px">${escapeHTML(a.name)} <span style="opacity:0.7">(${escapeHTML(a.category)})</span></a>`
    ).join("");
    addMessage(`${introText}<br>${list}`, "bot");
  }

  function handleMessage(text) {
    addMessage(escapeHTML(text), "user");

    // 1. clarifying-question follow-up
    if (CHAT_STATE.awaitingCategory) {
      CHAT_STATE.awaitingCategory = false;
      const expanded = expandIntent(text);
      const { exact, fuzzy } = searchAppsWeighted(expanded);
      if (exact.length) return renderAppList(exact, "Here's what I found:");
      if (fuzzy.length) return renderAppList(fuzzy, `I couldn't find an exact match — did you mean:`);
      return addMessage("I couldn't find anything matching that. Try a different word.", "bot");
    }

    // 2. knowledge base (greetings, site questions)
    const kbAnswer = checkKnowledgeBase(text);
    if (kbAnswer) return addMessage(kbAnswer, "bot");

    // 3. vague app request -> ask a clarifying question
    const wordCount = text.trim().split(/\s+/).length;
    const vaguePattern = /\b(an?|the)?\s*(app|game|apps|games)\b/i;
    const vagueBangla = /(আপ|অ্যাপ|গেম)/;
    if ((vaguePattern.test(text) || vagueBangla.test(text)) && wordCount <= 5) {
      CHAT_STATE.awaitingCategory = true;
      return addMessage("What kind? (e.g. action, puzzle, tools, VPN, photo editor...)", "bot");
    }

    // 4. otherwise: search directly (name/category/description/fuzzy)
    const expanded = expandIntent(text);
    const { exact, fuzzy } = searchAppsWeighted(expanded);
    if (exact.length) return renderAppList(exact, `Yes — here's what's available:`);
    if (fuzzy.length) return renderAppList(fuzzy, `That app isn't listed, but did you mean:`);
    addMessage("This app isn't available on our website yet. Try browsing by category on the homepage!", "bot");
  }

  function submit() {
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    handleMessage(text);
  }

  sendBtn.addEventListener("click", submit);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });

  addMessage(`Hi! I'm MRZN Assistant. Ask me to find an app, or ask me anything about ${SITE_INFO.websiteName}.`, "bot");
});
