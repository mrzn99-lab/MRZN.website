/*
  MRZN AI Assistant - Advanced Version
  Features:
  - Session-based chat memory (no DB persistence)
  - Multilingual support (বাংলা/Banglish/English)
  - Typo tolerance & fuzzy matching
  - App search from Supabase
  - Intelligent recommendations
  - APK analysis & security assessment
*/

class MRZNAssistant {
  constructor() {
    // Session memory (cleared on page refresh)
    this.chatHistory = [];
    this.userPreferences = {
      language: "auto", // auto-detect
      favoriteCategories: [],
      searchHistory: []
    };
    this.currentSession = new Date().getTime();
    this.appsCache = null; // Will load from Supabase once
  }

  // ===================== INIT =====================
  async initialize() {
    // Load apps catalog from Supabase (once per session)
    await this.loadAppsCatalog();
    console.log(`🤖 MRZN Assistant initialized. ${this.appsCache?.length || 0} apps loaded.`);
  }

  async loadAppsCatalog() {
    try {
      const { data, error } = await supabaseClient
        .from("apps")
        .select("id, name, category, description, rating:app_ratings(avg_rating, review_count), icon_url, download_url, permissions, security_score");
      
      if (error) throw error;
      this.appsCache = data || [];
    } catch (err) {
      console.error("Failed to load apps catalog:", err);
      this.appsCache = [];
    }
  }

  // ===================== LANGUAGE DETECTION =====================
  detectLanguage(text) {
    // Detect বাংলা, Banglish, or English
    const bengaliPattern = /[\u0980-\u09FF]/;
    const banglishPattern = /[a-z]+ [a-z]+/i; // Common Banglish words
    
    if (bengaliPattern.test(text)) return "bengali";
    if (text.match(/\b(ami|amar|tomar|ei|oi|hocche)\b/i)) return "banglish";
    return "english";
  }

  // ===================== TYPO CORRECTION =====================
  levenshtein(a, b) {
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

  fuzzySearch(query, candidates, threshold = 0.6) {
    // Typo-tolerant search
    const results = candidates
      .map(item => ({
        ...item,
        score: 1 - this.levenshtein(query.toLowerCase(), item.name.toLowerCase()) 
                   / Math.max(query.length, item.name.length)
      }))
      .filter(item => item.score >= threshold)
      .sort((a, b) => b.score - a.score);
    
    return results;
  }

  // ===================== INTENT RECOGNITION =====================
  recognizeIntent(text) {
    const lower = text.toLowerCase();
    
    // Search/Browse intents
    if (/খুঁজ|find|search|show|দেখ|দেখাও/.test(lower)) return "SEARCH";
    if (/সব|all|category|list/.test(lower)) return "BROWSE";
    
    // Comparison intents
    if (/vs|versus|বনাম|compare|পার্থক্য|difference/.test(lower)) return "COMPARE";
    if (/সুপারিশ|recommend|suggest|চাই|চান/.test(lower)) return "RECOMMEND";
    
    // Detail intents
    if (/details|বিস্তারিত|কি|কি\?|কত|কেন/.test(lower)) return "DETAIL";
    if (/rating|রেটিং|রেট/.test(lower)) return "RATING";
    if (/permission|অনুমতি|access/.test(lower)) return "PERMISSION";
    if (/safe|secure|নিরাপদ|সিকিউর|বিপদ/.test(lower)) return "SECURITY";
    if (/category|ক্যাটেগরি|ধরন|type/.test(lower)) return "CATEGORY";
    if (/trending|জনপ্রিয়|popular|হট/.test(lower)) return "TRENDING";
    
    // Help/Greeting
    if (/হাই|hello|hi|সালাম|হেলো|সাহায্য|help/.test(lower)) return "GREETING";
    
    return "SEARCH"; // Default to search
  }

  // ===================== ENTITY EXTRACTION =====================
  extractEntities(text) {
    // Extract app names, categories, etc. from text
    const entities = {
      appNames: [],
      categories: [],
      keywords: []
    };

    // Find app names (exact matches from catalog)
    for (const app of this.appsCache) {
      if (text.toLowerCase().includes(app.name.toLowerCase())) {
        entities.appNames.push({
          name: app.name,
          id: app.id,
          confidence: 1.0
        });
      }
    }

    // Find categories
    const allCategories = [...new Set(this.appsCache.map(a => a.category))];
    for (const cat of allCategories) {
      if (text.toLowerCase().includes(cat.toLowerCase())) {
        entities.categories.push(cat);
      }
    }

    // Extract keywords (words that aren't stop words)
    const stopWords = [
      "the", "a", "an", "and", "or", "but", "in", "on", "at",
      "কি", "কেন", "কোথায়", "কত", "কার", "হল", "হলে"
    ];
    const words = text.split(/\s+/).filter(w => !stopWords.includes(w.toLowerCase()));
    entities.keywords = words;

    return entities;
  }

  // ===================== SEARCH ENGINE =====================
  async searchApps(query, filters = {}) {
    if (!this.appsCache?.length) {
      return { apps: [], status: "error", message: "App catalog not loaded" };
    }

    // 1. Exact name match
    const exactMatches = this.appsCache.filter(app =>
      app.name.toLowerCase().includes(query.toLowerCase())
    );

    // 2. Fuzzy name match (typo tolerance)
    const fuzzyMatches = this.fuzzySearch(query, this.appsCache, 0.55);

    // 3. Category match
    const categoryMatches = this.appsCache.filter(app =>
      app.category.toLowerCase().includes(query.toLowerCase())
    );

    // 4. Description match
    const descMatches = this.appsCache.filter(app =>
      app.description.toLowerCase().includes(query.toLowerCase())
    );

    // Combine & deduplicate, preserving order by relevance
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
    if (filters.minRating) {
      filtered = filtered.filter(a => (a.rating?.avg_rating || 0) >= filters.minRating);
    }
    if (filters.sort === "rating") {
      filtered.sort((a, b) => (b.rating?.avg_rating || 0) - (a.rating?.avg_rating || 0));
    }

    return {
      apps: filtered.slice(0, 10),
      total: allMatches.length,
      status: "success"
    };
  }

  // ===================== RECOMMENDATION ENGINE =====================
  async getRecommendations(userPreferences) {
    // Recommend apps based on user's interests
    let recommendations = this.appsCache.slice();

    // Filter by favorite categories
    if (userPreferences.favoriteCategories?.length) {
      recommendations = recommendations.filter(app =>
        userPreferences.favoriteCategories.includes(app.category)
      );
    }

    // Sort by rating & review count
    recommendations.sort((a, b) => {
      const aScore = (a.rating?.avg_rating || 0) * Math.sqrt(a.rating?.review_count || 1);
      const bScore = (b.rating?.avg_rating || 0) * Math.sqrt(b.rating?.review_count || 1);
      return bScore - aScore;
    });

    return recommendations.slice(0, 5);
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
      comparison: {
        aspect: [
          { label: "Name", app1: app1.name, app2: app2.name },
          { label: "Category", app1: app1.category, app2: app2.category },
          { label: "Rating", app1: app1.rating?.avg_rating || "—", app2: app2.rating?.avg_rating || "—" },
          { label: "Reviews", app1: app1.rating?.review_count || 0, app2: app2.rating?.review_count || 0 },
          { label: "Size", app1: app1.app_size || "—", app2: app2.app_size || "—" },
          { label: "Downloads", app1: app1.downloads || "—", app2: app2.downloads || "—" },
          { label: "Security Score", app1: app1.security_score || "?", app2: app2.security_score || "?" }
        ]
      }
    };
  }

  // ===================== APK ANALYSIS =====================
  async analyzeAPK(appId) {
    const app = this.appsCache.find(a => a.id === appId);
    if (!app) return { status: "error" };

    // Fetch detailed APK analysis
    const { data: details } = await supabaseClient
      .from("apps")
      .select("permissions, security_score, security_warnings, malware_scan")
      .eq("id", appId)
      .single();

    return {
      status: "success",
      appName: app.name,
      analysis: {
        permissions: details?.permissions || [],
        securityScore: details?.security_score || 0,
        warnings: details?.security_warnings || [],
        malwareScan: details?.malware_scan || "Not scanned",
        assessment: this.assessSecurity(details?.security_score || 0)
      }
    };
  }

  assessSecurity(score) {
    if (score >= 90) return "🟢 Very Safe";
    if (score >= 70) return "🟡 Generally Safe";
    if (score >= 50) return "🟠 Caution Advised";
    return "🔴 High Risk - Review Carefully";
  }

  // ===================== RESPONSE FORMATTING =====================
  formatResponse(type, data) {
    switch (type) {
      case "SEARCH_RESULTS":
        return this.formatSearchResults(data);
      case "COMPARISON":
        return this.formatComparison(data);
      case "APK_ANALYSIS":
        return this.formatAPKAnalysis(data);
      case "RECOMMENDATION":
        return this.formatRecommendation(data);
      default:
        return JSON.stringify(data);
    }
  }

  formatSearchResults(results) {
    if (!results.apps.length) {
      return `❌ কোনো app পাওয়া যায়নি। অন্য নাম দিয়ে search করুন।`;
    }

    let html = `<div class="ai-search-results">`;
    results.apps.forEach((app, i) => {
      html += `
        <div class="ai-app-card">
          <img src="${app.icon_url}" class="ai-app-icon">
          <div class="ai-app-info">
            <div class="ai-app-name">${app.name}</div>
            <div class="ai-app-category">${app.category}</div>
            <div class="ai-app-rating">
              ⭐ ${app.rating?.avg_rating || "—"} (${app.rating?.review_count || 0} reviews)
            </div>
            <div class="ai-app-desc">${app.description}</div>
            <button onclick="window.location.href='app.html?id=${app.id}'" class="btn btn-sm">Details</button>
          </div>
        </div>
      `;
    });
    html += `</div>`;
    return html;
  }

  formatComparison(comparison) {
    if (comparison.status !== "success") return comparison.message;
    
    let html = `<div class="ai-comparison-table">
      <table>
        <tr>
          <th>Aspect</th>
          <th>App 1</th>
          <th>App 2</th>
        </tr>`;
    
    comparison.comparison.aspect.forEach(row => {
      html += `
        <tr>
          <td>${row.label}</td>
          <td>${row.app1}</td>
          <td>${row.app2}</td>
        </tr>
      `;
    });
    html += `</table></div>`;
    return html;
  }

  formatAPKAnalysis(analysis) {
    if (analysis.status !== "success") return "APK analysis not available";
    
    return `
      <div class="ai-apk-analysis">
        <h4>${analysis.appName}</h4>
        <p><strong>Security Assessment:</strong> ${analysis.analysis.assessment}</p>
        <p><strong>Security Score:</strong> ${analysis.analysis.securityScore}/100</p>
        <p><strong>Permissions:</strong></p>
        <ul>
          ${analysis.analysis.permissions.map(p => `<li>📌 ${p}</li>`).join("")}
        </ul>
        <p><strong>Warnings:</strong></p>
        ${analysis.analysis.warnings.length ? 
          `<ul>${analysis.analysis.warnings.map(w => `<li>⚠️ ${w}</li>`).join("")}</ul>` 
          : "<p>No warnings detected</p>"
        }
      </div>
    `;
  }

  formatRecommendation(apps) {
    let html = `<div class="ai-recommendations"><p>📱 আপনার জন্য সুপারিশ:</p><ul>`;
    apps.forEach(app => {
      html += `<li><strong>${app.name}</strong> (${app.category}) - ⭐ ${app.rating?.avg_rating || "—"}</li>`;
    });
    html += `</ul></div>`;
    return html;
  }

  // ===================== MESSAGE HANDLER =====================
  async handleUserMessage(userMessage) {
    // Add to chat history
    this.chatHistory.push({
      type: "user",
      message: userMessage,
      timestamp: new Date()
    });

    // Detect language
    const language = this.detectLanguage(userMessage);

    // Recognize intent
    const intent = this.recognizeIntent(userMessage);

    // Extract entities
    const entities = this.extractEntities(userMessage);

    // Process based on intent
    let response;
    switch (intent) {
      case "SEARCH":
        const query = entities.keywords.join(" ") || userMessage;
        const searchResults = await this.searchApps(query);
        response = {
          text: `${searchResults.apps.length} apps পাওয়া গেছে:`,
          html: this.formatResponse("SEARCH_RESULTS", searchResults),
          metadata: searchResults
        };
        break;

      case "COMPARE":
        if (entities.appNames.length >= 2) {
          const comparison = this.compareApps(
            entities.appNames[0].id,
            entities.appNames[1].id
          );
          response = {
            text: `${entities.appNames[0].name} vs ${entities.appNames[1].name} এর তুলনা:`,
            html: this.formatResponse("COMPARISON", comparison)
          };
        } else {
          response = {
            text: "কমপক্ষে 2টি app এর নাম বলুন তুলনা করার জন্য।"
          };
        }
        break;

      case "SECURITY":
        if (entities.appNames.length) {
          const analysis = await this.analyzeAPK(entities.appNames[0].id);
          response = {
            text: `${entities.appNames[0].name} এর নিরাপত্তা বিশ্লেষণ:`,
            html: this.formatResponse("APK_ANALYSIS", analysis)
          };
        } else {
          response = {
            text: "কোন app এর জন্য নিরাপত্তা তথ্য চান? App এর নাম বলুন।"
          };
        }
        break;

      case "RECOMMEND":
        this.userPreferences.favoriteCategories = entities.categories;
        const recommendations = await this.getRecommendations(this.userPreferences);
        response = {
          text: "আপনার পছন্দ অনুযায়ী:",
          html: this.formatResponse("RECOMMENDATION", recommendations)
        };
        break;

      case "BROWSE":
        if (entities.categories.length) {
          const categoryApps = this.appsCache.filter(a => 
            entities.categories.includes(a.category)
          );
          response = {
            text: `${entities.categories[0]} category-এ ${categoryApps.length}টি app আছে।`,
            html: this.formatResponse("SEARCH_RESULTS", { apps: categoryApps.slice(0, 5) })
          };
        }
        break;

      default:
        response = {
          text: "আমি শুধু apps/games সম্পর্কিত প্রশ্নের উত্তর দিতে পারি। কোন app খুঁজছেন?"
        };
    }

    // Add bot response to history
    this.chatHistory.push({
      type: "assistant",
      message: response.text,
      html: response.html,
      timestamp: new Date(),
      metadata: response.metadata
    });

    return response;
  }

  // ===================== CHAT HISTORY =====================
  getChatHistory() {
    return this.chatHistory; // Session-only, not persisted
  }

  clearHistory() {
    this.chatHistory = [];
  }
}

// ==================== GLOBAL INSTANCE ====================
let mrzn_ai_assistant = null;

document.addEventListener("DOMContentLoaded", async () => {
  mrzn_ai_assistant = new MRZNAssistant();
  await mrzn_ai_assistant.initialize();
});
