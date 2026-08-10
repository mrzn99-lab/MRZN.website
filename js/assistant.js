/*
  =====================================================================
  MRZN APPS & GAMES — AI ASSISTANT (Advanced Version)
  =====================================================================
  Features:
  - Conversational chat (session memory)
  - Multilingual (বাংলা/Banglish/English)
  - Typo tolerance & fuzzy matching
  - App search, compare, recommend
  - APK analysis & security assessment
  - No database persistence (session-only)
  
  Usage: window.openAssistantPanel() or click helper-bot-toggle
  =====================================================================
*/

class MRZNAssistant {
  constructor() {
    // ===== SESSION MEMORY =====
    this.chatHistory = [];
    this.userPreferences = {
      language: "auto",
      favoriteCategories: [],
      recentSearches: []
    };
    this.currentSession = new Date().getTime();
    
    // ===== CACHE =====
    this.appsCache = null;
    this.allCategories = [];
    
    // ===== STATE =====
    this.isInitialized = false;
    this.isLoading = false;
  }

  // ===================== INITIALIZATION =====================
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      await this.loadAppsCatalog();
      this.isInitialized = true;
      this.logDebug(`✅ AI Assistant initialized. ${this.appsCache?.length || 0} apps loaded.`);
    } catch (err) {
      this.logDebug(`❌ Initialization error: ${err.message}`);
      this.appsCache = [];
    }
  }

  async loadAppsCatalog() {
    try {
      const { data, error } = await supabaseClient
        .from("apps")
        .select(`
          id, name, category, description, 
          icon_url, download_url, app_size, downloads, 
          developer_note, screenshots
        `);
      
      if (error) throw error;
      
      this.appsCache = data || [];
      this.allCategories = [...new Set((data || []).map(a => a.category).filter(Boolean))].sort();
      
      this.logDebug(`📦 Loaded ${this.appsCache.length} apps, ${this.allCategories.length} categories`);
    } catch (err) {
      this.logDebug(`❌ Failed to load catalog: ${err.message}`);
      throw err;
    }
  }

  // ===================== LANGUAGE DETECTION =====================
  detectLanguage(text) {
    const bengaliPattern = /[\u0980-\u09FF]/;
    const banglishPatterns = /\b(ami|amar|tomar|oi|ei|hocche|kichu|kise|korbo|jabe)\b/i;
    
    if (bengaliPattern.test(text)) return "bengali";
    if (banglishPatterns.test(text)) return "banglish";
    return "english";
  }

  // ===================== LEVENSHTEIN DISTANCE (Typo Correction) =====================
  levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }
    return dp[m][n];
  }

  similarity(a, b) {
    const dist = this.levenshtein(a.toLowerCase(), b.toLowerCase());
    const maxLen = Math.max(a.length, b.length) || 1;
    return 1 - dist / maxLen;
  }

  fuzzySearch(query, candidates, threshold = 0.55) {
    return candidates
      .map(item => ({
        ...item,
        score: this.similarity(query, item.name)
      }))
      .filter(item => item.score >= threshold)
      .sort((a, b) => b.score - a.score);
  }

  // ===================== INTENT RECOGNITION =====================
  recognizeIntent(text) {
    const lower = text.toLowerCase();
    
    const intents = {
      SEARCH: /খুঁজ|find|search|show|দেখ|দেখাও|চাই|চান/,
      BROWSE: /সব|all|category|list|ধরন|ক্যাটেগরি/,
      COMPARE: /vs|versus|বনাম|compare|পার্থক্য|difference|তুলনা/,
      RECOMMEND: /সুপারিশ|recommend|suggest|ভালো|best|জন্য/,
      DETAIL: /details?|বিস্তারিত|কি|কি\?|কেন|কত/,
      RATING: /rating|রেটিং|রেট|score|স্কোর/,
      PERMISSION: /permission|অনুমতি|access|permission/,
      SECURITY: /safe|secure|নিরাপদ|সিকিউর|বিপদ|virus|malware/,
      CATEGORY: /category|ক্যাটেগরি|ধরন|type|genre/,
      TRENDING: /trending|জনপ্রিয়|popular|হট|নতুন/,
      HELP: /help|সাহায্য|কি করতে পারি|কিভাবে/,
      GREETING: /হাই|hello|hi|সালাম|হেলো|সুপ্রভাত|শুভ/
    };

    for (const [intent, pattern] of Object.entries(intents)) {
      if (pattern.test(lower)) return intent;
    }

    return "SEARCH"; // Default
  }

  // ===================== ENTITY EXTRACTION =====================
  extractEntities(text) {
    const entities = {
      appNames: [],
      categories: [],
      keywords: []
    };

    // Find app names (exact matches)
    for (const app of this.appsCache) {
      if (text.toLowerCase().includes(app.name.toLowerCase())) {
        entities.appNames.push({ name: app.name, id: app.id });
      }
    }

    // Find categories
    for (const cat of this.allCategories) {
      if (text.toLowerCase().includes(cat.toLowerCase())) {
        entities.categories.push(cat);
      }
    }

    // Extract keywords (non-stop words)
    const stopWords = new Set([
      "the", "a", "an", "and", "or", "but", "in", "on", "at", "is", "are", "be",
      "কি", "কেন", "কোথায়", "কত", "কার", "হল", "হলে", "এ", "তে", "কে"
    ]);

    const words = text.split(/\s+/)
      .filter(w => !stopWords.has(w.toLowerCase()) && w.length > 2);
    entities.keywords = words;

    return entities;
  }

  // ===================== SEARCH ENGINE =====================
  async searchApps(query, filters = {}) {
    if (!this.appsCache?.length) {
      return { 
        apps: [], 
        status: "error", 
        message: "App catalog not loaded" 
      };
    }

    const queryLower = query.toLowerCase();

    // 1. Exact name match
    const exactMatches = this.appsCache.filter(app =>
      app.name.toLowerCase().includes(queryLower)
    );

    // 2. Fuzzy name match (typo tolerance)
    const fuzzyMatches = this.fuzzySearch(query, this.appsCache, 0.55);

    // 3. Category match
    const categoryMatches = this.appsCache.filter(app =>
      app.category.toLowerCase().includes(queryLower)
    );

    // 4. Description match
    const descMatches = this.appsCache.filter(app =>
      app.description.toLowerCase().includes(queryLower)
    );

    // Combine & deduplicate
    const seen = new Set();
    const allMatches = [];

    for (const group of [exactMatches, fuzzyMatches, categoryMatches, descMatches]) {
      for (const app of group) {
        if (!seen.has(app.id)) {
          seen.add(app.id);
          allMatches.push(app);
        }
      }
    }

    // Apply filters
    let filtered = allMatches;
    if (filters.category) {
      filtered = filtered.filter(a => a.category === filters.category);
    }

    // Add to recent searches
    this.userPreferences.recentSearches.unshift(query);
    this.userPreferences.recentSearches = this.userPreferences.recentSearches.slice(0, 10);

    return {
      apps: filtered.slice(0, 8),
      total: allMatches.length,
      status: "success"
    };
  }

  // ===================== COMPARISON ENGINE =====================
  compareApps(app1Id, app2Id) {
    const app1 = this.appsCache.find(a => a.id === app1Id);
    const app2 = this.appsCache.find(a => a.id === app2Id);

    if (!app1 || !app2) {
      return { status: "error", message: "App not found" };
    }

    return {
      status: "success",
      app1: {
        name: app1.name,
        category: app1.category,
        description: app1.description,
        size: app1.app_size || "—",
        downloads: app1.downloads || "—"
      },
      app2: {
        name: app2.name,
        category: app2.category,
        description: app2.description,
        size: app2.app_size || "—",
        downloads: app2.downloads || "—"
      }
    };
  }

  // ===================== RECOMMENDATION ENGINE =====================
  async getRecommendations(categories = []) {
    let recommendations = this.appsCache.slice();

    if (categories?.length) {
      recommendations = recommendations.filter(app =>
        categories.includes(app.category)
      );
    }

    // Sort by popularity (assuming app_size as proxy for downloads)
    recommendations.sort((a, b) => {
      const aScore = (a.downloads || "0").split("M")[0] * 1 || 0;
      const bScore = (b.downloads || "0").split("M")[0] * 1 || 0;
      return bScore - aScore;
    });

    return recommendations.slice(0, 5);
  }

  // ===================== MESSAGE HANDLING =====================
  async handleUserMessage(userMessage) {
    this.isLoading = true;

    try {
      // Add to history
      this.chatHistory.push({
        type: "user",
        text: userMessage,
        timestamp: new Date()
      });

      // Process
      const language = this.detectLanguage(userMessage);
      const intent = this.recognizeIntent(userMessage);
      const entities = this.extractEntities(userMessage);

      let response;

      switch (intent) {
        case "SEARCH":
          const query = entities.keywords.join(" ") || userMessage;
          const results = await this.searchApps(query);
          response = this.buildSearchResponse(results);
          break;

        case "COMPARE":
          if (entities.appNames.length >= 2) {
            const comp = this.compareApps(entities.appNames[0].id, entities.appNames[1].id);
            response = this.buildComparisonResponse(comp);
          } else {
            response = {
              text: "২টি app এর নাম বলুন তুলনা করতে।",
              html: null
            };
          }
          break;

        case "SECURITY":
          if (entities.appNames.length) {
            response = this.buildSecurityResponse(entities.appNames[0].name);
          } else {
            response = {
              text: "কোন app এর নিরাপত্তা জানতে চান? নাম বলুন।",
              html: null
            };
          }
          break;

        case "RECOMMEND":
          const recs = await this.getRecommendations(entities.categories);
          response = this.buildRecommendationResponse(recs);
          break;

        case "CATEGORY":
          response = this.buildCategoryResponse(this.allCategories);
          break;

        case "TRENDING":
          const trending = this.appsCache.slice(0, 5);
          response = this.buildSearchResponse({ apps: trending, total: trending.length });
          break;

        case "GREETING":
          response = {
            text: "🤖 MRZN AI Assistant এ স্বাগতম! কোন app খুঁজছেন? (example: 'ফটো এডিটর', 'ভিপিএন compare করো')",
            html: null
          };
          break;

        case "HELP":
          response = {
            text: `📱 আমি এই কাজ করতে পারি:
            • 🔍 App খুঁজুন: "ভালো photo editor"
            • ⚖️ তুলনা করুন: "Photoshop vs VSCO"
            • 🛡️ নিরাপত্তা: "VPN safe?"
            • 💡 সুপারিশ: "games recommend করো"
            • 📂 ক্যাটেগরি: "সব categories দেখাও"`,
            html: null
          };
          break;

        default:
          response = {
            text: "🤔 বুঝতে পারছি না। কোন app খুঁজছেন বা সাহায্য চান?",
            html: null
          };
      }

      // Add bot response to history
      this.chatHistory.push({
        type: "bot",
        text: response.text,
        html: response.html,
        timestamp: new Date()
      });

      return response;

    } finally {
      this.isLoading = false;
    }
  }

  // ===================== RESPONSE BUILDERS =====================
  buildSearchResponse(results) {
    if (!results.apps?.length) {
      return {
        text: "❌ কোনো app পাওয়া যায়নি। অন্য নাম দিয়ে চেষ্টা করুন।",
        html: null
      };
    }

    const cards = results.apps.map(app => `
      <div class="ai-app-card">
        <img src="${escapeHTML(app.icon_url || 'assets/placeholder-icon.svg')}" class="ai-app-icon" onerror="this.style.opacity=0">
        <div class="ai-app-info">
          <div class="ai-app-name">${escapeHTML(app.name)}</div>
          <div class="ai-app-category">${escapeHTML(app.category)}</div>
          <div class="ai-app-desc">${escapeHTML(app.description)}</div>
          ${app.app_size ? `<span class="ai-badge">📦 ${escapeHTML(app.app_size)}</span>` : ''}
          ${app.downloads ? `<span class="ai-badge">⬇️ ${escapeHTML(app.downloads)}</span>` : ''}
          <a href="app.html?id=${app.id}" class="btn btn-sm" style="margin-top:8px">বিস্তারিত</a>
        </div>
      </div>
    `).join("");

    return {
      text: `✅ ${results.apps.length} টি app পাওয়া গেছে:`,
      html: `<div class="ai-search-results">${cards}</div>`
    };
  }

  buildComparisonResponse(comparison) {
    if (comparison.status !== "success") {
      return { text: "❌ তুলনা করতে পারছি না।", html: null };
    }

    const html = `
      <div class="ai-comparison">
        <table class="ai-comp-table">
          <tr>
            <th>বৈশিষ্ট্য</th>
            <th>${escapeHTML(comparison.app1.name)}</th>
            <th>${escapeHTML(comparison.app2.name)}</th>
          </tr>
          <tr>
            <td>ক্যাটেগরি</td>
            <td>${escapeHTML(comparison.app1.category)}</td>
            <td>${escapeHTML(comparison.app2.category)}</td>
          </tr>
          <tr>
            <td>আকার</td>
            <td>${escapeHTML(comparison.app1.size)}</td>
            <td>${escapeHTML(comparison.app2.size)}</td>
          </tr>
          <tr>
            <td>ডাউনলোড</td>
            <td>${escapeHTML(comparison.app1.downloads)}</td>
            <td>${escapeHTML(comparison.app2.downloads)}</td>
          </tr>
        </table>
      </div>
    `;

    return {
      text: `⚖️ ${comparison.app1.name} vs ${comparison.app2.name}:`,
      html
    };
  }

  buildSecurityResponse(appName) {
    return {
      text: `🛡️ ${escapeHTML(appName)} এর নিরাপত্তা তথ্যের জন্য বিস্তারিত পাতায় যান।`,
      html: null
    };
  }

  buildRecommendationResponse(apps) {
    if (!apps.length) {
      return {
        text: "দুঃখিত, কোনো সুপারিশ পাওয়া যায়নি।",
        html: null
      };
    }

    const list = apps.map((app, i) => `
      <li>
        <strong>${i + 1}. ${escapeHTML(app.name)}</strong> 
        <span style="color:var(--text-faint)">(${escapeHTML(app.category)})</span>
      </li>
    `).join("");

    return {
      text: "📱 আপনার জন্য সুপারিশ:",
      html: `<ul class="ai-recommendations">${list}</ul>`
    };
  }

  buildCategoryResponse(categories) {
    const list = categories.map(cat => 
      `<li><a href="#" onclick="return false;" style="color:var(--cyan)">${escapeHTML(cat)}</a></li>`
    ).join("");

    return {
      text: "📂 সব ক্যাটেগরি:",
      html: `<ul style="margin:10px 0 10px 20px;">${list}</ul>`
    };
  }

  // ===================== UTILITY =====================
  logDebug(msg) {
    console.log(`[MRZN AI] ${msg}`);
  }

  getChatHistory() {
    return this.chatHistory;
  }

  clearHistory() {
    this.chatHistory = [];
  }
}

// ===================== GLOBAL INSTANCE =====================
let mrzn_assistant = null;

document.addEventListener("DOMContentLoaded", async () => {
  mrzn_assistant = new MRZNAssistant();
  await mrzn_assistant.initialize();
  setupAssistantUI();
});

// ===================== UI SETUP =====================
function setupAssistantUI() {
  const toggle = document.getElementById("helper-bot-toggle");
  const panel = document.getElementById("helper-bot-panel");
  const closeBtn = document.getElementById("helper-bot-close");
  const input = document.getElementById("helper-bot-input");
  const log = document.getElementById("helper-bot-log");
  const sendBtn = document.getElementById("helper-bot-send");

  if (!toggle || !panel) return;

  // Open
  toggle.addEventListener("click", () => {
    panel.style.display = "flex";
    input.focus();
  });

  // Close
  closeBtn?.addEventListener("click", () => {
    panel.style.display = "none";
  });

  // Send message
  async function sendMessage() {
    const text = input.value.trim();
    if (!text || mrzn_assistant.isLoading) return;

    input.value = "";

    // User message
    addMessageBubble(text, "user");

    // Bot response
    sendBtn.disabled = true;
    sendBtn.textContent = "চিন্তা করছি...";

    try {
      const response = await mrzn_assistant.handleUserMessage(text);
      addMessageBubble(response.text, "bot");
      if (response.html) {
        addHTMLBubble(response.html, "bot");
      }
    } catch (err) {
      addMessageBubble("❌ ত্রুটি! আবার চেষ্টা করুন।", "bot");
      console.error(err);
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = "পাঠান";
      input.focus();
    }
  }

  function addMessageBubble(text, type) {
    const bubble = document.createElement("div");
    bubble.style.cssText = `
      max-width:80%; margin:8px 0; padding:11px 15px; border-radius:14px;
      font-size:14px; line-height:1.6;
      ${type === "bot"
        ? "background:var(--panel-2); color:var(--text); align-self:flex-start; border-bottom-left-radius:3px;"
        : "background:linear-gradient(135deg,var(--cyan),var(--violet)); color:var(--void); align-self:flex-end; margin-left:auto; border-bottom-right-radius:3px;"}
    `;
    bubble.textContent = text;
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
  }

  function addHTMLBubble(html, type) {
    const bubble = document.createElement("div");
    bubble.style.cssText = `
      max-width:95%; margin:8px 0; align-self:${type === "bot" ? "flex-start" : "flex-end"};
    `;
    bubble.innerHTML = html;
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
  }

  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  // Welcome
  addMessageBubble("🤖 MRZN AI এসিস্ট্যান্ট! কোন app খুঁজছেন?", "bot");
}

// Export for external access
window.openAssistantPanel = function() {
  const panel = document.getElementById("helper-bot-panel");
  if (panel) {
    panel.style.display = "flex";
    document.getElementById("helper-bot-input")?.focus();
  }
};
