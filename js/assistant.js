/*
  =====================================================================
  MRZN AI ASSISTANT — 100% FREE (Groq API)
  - Completely free, unlimited requests
  - No hardcoded API key (use environment variable)
  - Multilingual support
  =====================================================================
*/

class FreeAIAssistant {
  constructor() {
    this.chatHistory = [];
    
    // Get API key from environment or localStorage
    // NEVER hardcode in source!
    this.groqApiKey = this.getApiKey();
    
    this.groqApiUrl = "https://api.groq.com/openai/v1/chat/completions";
    this.isLoading = false;
    this.appsCache = null;
  }

  getApiKey() {
    // Try environment first (for server-side)
    if (typeof process !== 'undefined' && process.env?.GROQ_API_KEY) {
      return process.env.GROQ_API_KEY;
    }
    
    // Try localStorage (user can paste key on first visit)
    const storedKey = localStorage.getItem('groq_api_key');
    if (storedKey) return storedKey;
    
    // If no key, show setup modal
    this.showApiKeySetup();
    return null;
  }

  showApiKeySetup() {
    const key = prompt(
      `🔑 MRZN AI Assistant Setup\n\nএকটি free Groq API key প্রয়োজন:\n\n` +
      `1. Go to: https://console.groq.com\n` +
      `2. Create free account\n` +
      `3. Get API key\n` +
      `4. Paste below:\n\n` +
      `(Example: gsk_xxx...)`
    );
    
    if (key && key.startsWith('gsk_')) {
      localStorage.setItem('groq_api_key', key);
      this.groqApiKey = key;
      alert('✅ API key saved!');
    } else {
      alert('❌ Invalid key format. Must start with "gsk_"');
    }
  }

  async initialize() {
    try {
      await this.loadAppsCatalog();
      console.log("✅ AI Assistant initialized");
    } catch (err) {
      console.error("Init error:", err);
    }
  }

  async loadAppsCatalog() {
    try {
      const { data } = await supabaseClient
        .from("apps")
        .select("id, name, category, description, app_size, downloads")
        .limit(200);
      
      this.appsCache = data || [];
    } catch (err) {
      this.appsCache = [];
    }
  }

  detectLanguage(text) {
    const bengaliPattern = /[\u0980-\u09FF]/;
    const hindiPattern = /[\u0900-\u097F]/;
    const urduPattern = /[\u0600-\u06FF]/;
    
    if (bengaliPattern.test(text)) return "bengali";
    if (hindiPattern.test(text)) return "hindi";
    if (urduPattern.test(text)) return "urdu";
    return "english";
  }

  async sendMessage(userMessage) {
    this.isLoading = true;

    try {
      if (!this.groqApiKey) {
        throw new Error("API key not configured. Click Setup first.");
      }

      // Add to history
      this.chatHistory.push({
        role: "user",
        content: userMessage
      });

      // Get apps context
      let appsContext = "";
      if (this.appsCache?.length) {
        appsContext = this.appsCache
          .slice(0, 50)
          .map(app => `${app.name} (${app.category}): ${app.description}`)
          .join("\n");
      }

      const language = this.detectLanguage(userMessage);

      const systemPrompt = `আপনি MRZN Apps & Games এর একজন helpful AI assistant।

আপনার দায়িত্ব:
1. যেকোনো ভাষায় উত্তর দিন (Bengali, English, Hindi, Urdu, Banglish)
2. সবসময় সৎ এবং সঠিক তথ্য দিন
3. Apps/Games সম্পর্কে সাহায্য করুন - সুপারিশ, তুলনা, বিবরণ
4. প্রশ্নকারীর প্রশ্ন বুঝে উত্তর দিন (শুধু keyword search নয়)
5. মজাদার এবং কথোপকথনমূলক হন
6. যদি কোনো app না থাকে তো সৎভাবে বলুন

উপলব্ধ Apps:
${appsContext}`;

      // Call Groq API
      const response = await fetch(this.groqApiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.groqApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "mixtral-8x7b-32768",
          messages: [
            { role: "system", content: systemPrompt },
            ...this.chatHistory
          ],
          temperature: 0.7,
          max_tokens: 1024
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      // Add to history
      this.chatHistory.push({
        role: "assistant",
        content: aiResponse
      });

      return {
        text: aiResponse,
        language: language,
        success: true
      };

    } catch (err) {
      return {
        text: `❌ Error: ${err.message}`,
        success: false
      };
    } finally {
      this.isLoading = false;
    }
  }

  getChatHistory() {
    return this.chatHistory;
  }

  clearHistory() {
    this.chatHistory = [];
  }
}

// ===================== GLOBAL INSTANCE =====================
let aiAssistant = null;

document.addEventListener("DOMContentLoaded", async () => {
  aiAssistant = new FreeAIAssistant();
  await aiAssistant.initialize();
  setupChatUI();
});

// ===================== UI SETUP =====================
function setupChatUI() {
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

  async function sendMessage() {
    const text = input.value.trim();
    if (!text || aiAssistant.isLoading) return;

    input.value = "";
    addMessageBubble(text, "user");

    sendBtn.disabled = true;
    sendBtn.textContent = "চিন্তা করছি...";

    try {
      const response = await aiAssistant.sendMessage(text);
      addMessageBubble(response.text, "bot");
    } catch (err) {
      addMessageBubble(`❌ Error: ${err.message}`, "bot");
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = "পাঠান";
      input.focus();
    }
  }

  function addMessageBubble(text, type) {
    const bubble = document.createElement("div");
    bubble.style.cssText = `
      max-width:80%; margin:8px 0; padding:11px 15px; 
      border-radius:14px; font-size:14px; line-height:1.6;
      word-break:break-word;
      ${type === "bot"
        ? "background:var(--panel-2); color:var(--text); align-self:flex-start; border-bottom-left-radius:3px;"
        : "background:linear-gradient(135deg,var(--cyan),var(--violet)); color:var(--void); align-self:flex-end; margin-left:auto; border-bottom-right-radius:3px;"}
    `;
    bubble.textContent = text;
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
  }

  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  addMessageBubble(
    "🤖 MRZN AI Assistant!\n\n🎯 যেকোনো প্রশ্ন করুন:\n• Apps খুঁজুন\n• তুলনা করুন\n• সুপারিশ চান\n• যেকোনো বিষয়\n\n📱 সব ভাষায় উত্তর পাবেন!",
    "bot"
  );
}

window.openAssistantPanel = function() {
  const panel = document.getElementById("helper-bot-panel");
  if (panel) panel.style.display = "flex";
};
