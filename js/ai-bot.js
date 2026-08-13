class AIBot {
  constructor() {
    this.chatHistory = [];
    this.isLoading = false;
    this.appsCache = [];
    
    // দুটি Groq API keys
    this.groqKeys = [
      "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", // Gmail 1 থেকে
      "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"  // Gmail 2 থেকে
    ];
    
    this.currentKeyIndex = 0;
    this.messagesCount = 0;
    this.maxMessagesPerDay = 20; // প্রতি ব্যবহারকারী প্রতি দিনে 20 messages
    this.lastResetTime = new Date().getDate(); // Track day change
  }

  resetDailyLimitIfNeeded() {
    const today = new Date().getDate();
    if (today !== this.lastResetTime) {
      this.messagesCount = 0;
      this.lastResetTime = today;
      console.log("Daily limit reset");
    }
  }

  getNextKey() {
    const key = this.groqKeys[this.currentKeyIndex];
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.groqKeys.length;
    console.log(`Using API Key ${this.currentKeyIndex}`);
    return key;
  }

  async loadAppsFromDatabase() {
    try {
      if (!window.supabaseClient) return;
      const { data } = await window.supabaseClient
        .from("apps")
        .select("id, name, category, description")
        .limit(100);
      if (data) {
        this.appsCache = data;
        console.log("Apps loaded:", this.appsCache.length);
      }
    } catch (err) {
      console.error("DB error:", err);
    }
  }

  searchApps(query) {
    if (!this.appsCache?.length) return [];
    const q = query.toLowerCase();
    return this.appsCache.filter(app => 
      app.name?.toLowerCase().includes(q) ||
      app.category?.toLowerCase().includes(q)
    ).slice(0, 3);
  }

  async sendMessage(msg) {
    this.isLoading = true;
    try {
      // Check daily limit
      this.resetDailyLimitIfNeeded();
      
      if (this.messagesCount >= this.maxMessagesPerDay) {
        return { 
          text: `⚠️ Daily limit reached! (${this.messagesCount}/${this.maxMessagesPerDay})\nCome back tomorrow for more messages.`, 
          success: false 
        };
      }

      if (!msg?.trim()) {
        return { text: "Type a message", success: false };
      }

      this.chatHistory.push({ role: "user", content: msg });
      this.messagesCount++;

      const foundApps = this.searchApps(msg);
      let appList = foundApps.length > 0 
        ? "\n[Apps: " + foundApps.map(a => a.name).join(", ") + "]" 
        : "";

      const messages = [
        {
          role: "system",
          content: `MRZN AI: Search & show apps. Compare. Recommend. Never fake data.${appList}`
        },
        ...this.chatHistory.slice(-2)
      ];

      // Get next API key (rotate between two)
      const groqKey = this.getNextKey();

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: messages,
          max_tokens: 512,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const err = await response.json();
        const errorMsg = err.error?.message || "API Error";
        console.error("API Error:", errorMsg);
        
        if (errorMsg.includes("rate limit")) {
          return { 
            text: "⚠️ API rate limit. Trying alternate key...", 
            success: false 
          };
        }
        
        throw new Error(errorMsg);
      }

      const data = await response.json();

      if (!data?.choices?.[0]?.message?.content) {
        throw new Error("Invalid response");
      }

      const reply = data.choices[0].message.content;
      this.chatHistory.push({ role: "assistant", content: reply });

      // Show remaining messages
      const remaining = this.maxMessagesPerDay - this.messagesCount;
      const messageInfo = remaining > 0 ? `\n\n📊 (${this.messagesCount}/${this.maxMessagesPerDay} - ${remaining} left today)` : "";

      return { text: reply + messageInfo, success: true };

    } catch (error) {
      console.error("Error:", error);
      return { text: `❌ Error: ${error?.message || "Unknown error"}`, success: false };
    } finally {
      this.isLoading = false;
    }
  }
}

let bot = null;

document.addEventListener("DOMContentLoaded", async () => {
  bot = new AIBot();
  await bot.loadAppsFromDatabase();
  setupUI();
});

function setupUI() {
  const toggle = document.getElementById("helper-bot-toggle");
  const panel = document.getElementById("helper-bot-panel");
  const close = document.getElementById("helper-bot-close");
  const input = document.getElementById("helper-bot-input");
  const log = document.getElementById("helper-bot-log");
  const send = document.getElementById("helper-bot-send");

  if (!toggle) return;

  toggle.addEventListener("click", () => {
    panel.style.display = "flex";
    input.focus();
  });

  close?.addEventListener("click", () => {
    panel.style.display = "none";
  });

  const sendMsg = () => {
    const text = input.value.trim();
    if (!text || bot.isLoading) return;

    input.value = "";
    addMsg(text, "user");
    send.disabled = true;
    send.textContent = "Thinking...";

    bot.sendMessage(text).then(res => {
      addMsg(res.text, "bot");
      send.disabled = false;
      send.textContent = "Send";
      input.focus();
    });
  };

  send.addEventListener("click", sendMsg);
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMsg();
    }
  });

  const addMsg = (text, type) => {
    if (!text) return;
    const div = document.createElement("div");
    div.style.cssText = `
      max-width:85%; margin:8px 0; padding:11px 15px; border-radius:14px;
      font-size:14px; line-height:1.5; word-break:break-word;
      ${type === "bot"
        ? "background:var(--panel-2); color:var(--text); align-self:flex-start;"
        : "background:linear-gradient(135deg,var(--cyan),var(--violet)); color:var(--void); align-self:flex-end; margin-left:auto;"}
    `;
    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  };

  addMsg("🤖 MRZN AI Assistant\n📊 20 messages/day limit\n🔄 Dual API powered", "bot");
}
