/*
  =====================================================================
  MRZN AI ASSISTANT — 100% FREE (Groq API)
  - Completely free, unlimited requests
  - No token limits
  - Super fast
  - Multilingual support
  =====================================================================
*/

class FreeAIAssistant {
  constructor() {
    this.chatHistory = [];
    this.groqApiKey = "API_KEY"; // Free API key from groq.com
    this.groqApiUrl = "https://api.groq.com/openai/v1/chat/completions";
    this.isLoading = false;
  }

  async initialize() {
    console.log("✅ Free AI Assistant initialized (Groq)");
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

  async getAppsContext() {
    // Get apps from your Supabase (free tier)
    try {
      const { data } = await supabaseClient
        .from("apps")
        .select("name, category, description")
        .limit(100);

      if (!data?.length) return "";

      const appsList = data
        .map(app => `${app.name} (${app.category}): ${app.description}`)
        .join("\n");

      return `উপলব্ধ Apps:\n${appsList}`;
    } catch (err) {
      return "";
    }
  }

  async sendMessage(userMessage) {
    this.isLoading = true;

    try {
      // Add to history
      this.chatHistory.push({
        role: "user",
        content: userMessage
      });

      // Get apps context
      const appsContext = await this.getAppsContext();
      const language = this.detectLanguage(userMessage);

      // System prompt
      const systemPrompt = `আপনি MRZN Apps & Games এর একজন helpful AI assistant।

আপনার দায়িত্ব:
1. যেকোনো ভাষায় উত্তর দিন (Bengali, English, Hindi, Urdu, Banglish সবকিছু)
2. সবসময় সৎ এবং সঠিক তথ্য দিন
3. Apps/Games সম্পর্কে সাহায্য করুন - সুপারিশ, তুলনা, বিবরণ
4. প্রশ্নকারীর প্রশ্ন বুঝে উত্তর দিন (শুধু keyword search নয়)
5. মজাদার এবং কথোপকথনমূলক হন
6. যদি কোনো app না থাকে তো সৎভাবে বলুন

${appsContext}`;

      // Call Groq API (completely free)
      const response = await fetch(this.groqApiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.groqApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "mixtral-8x7b-32768", // Free, powerful model
          messages: [
            { role: "system", content: systemPrompt },
            ...this.chatHistory
          ],
          temperature: 0.7,
          max_tokens: 1024,
          top_p: 1
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "API Error");
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
      console.error("Error:", err);
      return {
        text: `❌ ত্রুটি: ${err.message}`,
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

  // Open panel
  toggle.addEventListener("click", () => {
    panel.style.display = "flex";
    input.focus();
  });

  // Close panel
  closeBtn?.addEventListener("click", () => {
    panel.style.display = "none";
  });

  // Send message
  async function sendMessage() {
    const text = input.value.trim();
    if (!text || aiAssistant.isLoading) return;

    input.value = "";

    // Display user message
    addMessageBubble(text, "user");

    // Show loading
    sendBtn.disabled = true;
    sendBtn.textContent = "চিন্তা করছি...";

    try {
      // Get AI response
      const response = await aiAssistant.sendMessage(text);

      if (response.success) {
        addMessageBubble(response.text, "bot");
      } else {
        addMessageBubble(response.text, "bot");
      }

    } catch (err) {
      addMessageBubble(`❌ কিছু ভুল হয়েছে: ${err.message}`, "bot");
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

  // Welcome
  addMessageBubble(
    "🤖 MRZN AI Assistant!\n\n🎯 আপনি যেকোনো প্রশ্ন করতে পারেন:\n• Apps খুঁজুন\n• তুলনা করুন\n• সুপারিশ চান\n• যেকোনো বিষয়ে জিজ্ঞাসা করুন\n\n📱 বাংলা, English, Banglish - সব ভাষায় উত্তর পাবেন!",
    "bot"
  );
}

window.openAssistantPanel = function() {
  const panel = document.getElementById("helper-bot-panel");
  if (panel) panel.style.display = "flex";
};
