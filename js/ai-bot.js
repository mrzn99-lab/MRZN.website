class AIBot {
  constructor() {
    this.chatHistory = [];
    this.isLoading = false;
    this.appsCache = [];
    
    this.groqKeys = [
      "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",
      "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"
    ];
    
    this.currentKeyIndex = 0;
    this.messagesCount = 0;
    this.maxMessagesPerDay = 7;    // ✅ Changed to 7 (was 10)
    this.lastResetTime = new Date().getDate();
  }

  resetDailyLimitIfNeeded() {
    const today = new Date().getDate();
    if (today !== this.lastResetTime) {
      this.messagesCount = 0;
      this.lastResetTime = today;
    }
  }

  getNextKey() {
    const key = this.groqKeys[this.currentKeyIndex];
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.groqKeys.length;
    return key;
  }

  async loadAppsFromDatabase() {
    try {
      if (!window.supabaseClient) return;
      const { data } = await window.supabaseClient
        .from("apps")
        .select("id, name, category, description")
        .limit(100);
      if (data) this.appsCache = data;
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
      this.resetDailyLimitIfNeeded();
      
      if (this.messagesCount >= this.maxMessagesPerDay) {
        return { 
          text: `Daily limit reached (${this.maxMessagesPerDay} messages/day). Try again tomorrow!`, 
          success: false 
        };
      }

      if (!msg?.trim()) {
        return { text: "Type a message", success: false };
      }

      this.messagesCount++;

      const foundApps = this.searchApps(msg);
      let appInfo = foundApps.length > 0 
        ? "\nApps found: " + foundApps.map(a => a.name).join(", ")
        : "";

      const messages = [
        {
          role: "system",
          content: `MRZN AI assistant. Provide complete, detailed answers (3-4 paragraphs). Be thorough and informative.${appInfo}`
        },
        {
          role: "user",
          content: msg
        }
      ];

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
          max_tokens: 800,         // ✅ Full answers
          temperature: 0.7,
          top_p: 0.95
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "API Error");
      }

      const data = await response.json();

      if (!data?.choices?.[0]?.message?.content) {
        throw new Error("Invalid response");
      }

      const reply = data.choices[0].message.content;
      const finishReason = data.choices[0].finish_reason;
      
      console.log(`Finish: ${finishReason}`);

      let finalReply = reply;
      if (finishReason === "length") {
        finalReply = reply + "\n\n[Response trimmed - ask for more details]";
      }
      
      const remaining = this.maxMessagesPerDay - this.messagesCount;

      return { 
        text: finalReply, 
        success: true,
        counter: `(${this.messagesCount}/${this.maxMessagesPerDay} - ${remaining} left)`
      };

    } catch (error) {
      console.error("Error:", error);
      return { text: `❌ ${error?.message}`, success: false };
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
      if (res.counter) {
        const counterDiv = document.createElement("div");
        counterDiv.style.cssText = `
          width:100%; text-align:center; font-size:12px;
          color:var(--text-secondary); margin-top:8px;
        `;
        counterDiv.textContent = res.counter;
        log.appendChild(counterDiv);
      }
      send.disabled = false;
      send.textContent = "Send";
      input.focus();
      log.scrollTop = log.scrollHeight;
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
      max-width:90%; margin:8px 0; padding:12px 15px; border-radius:14px;
      font-size:14px; line-height:1.6; word-break:break-word;
      ${type === "bot"
        ? "background:var(--panel-2); color:var(--text); align-self:flex-start;"
        : "background:linear-gradient(135deg,var(--cyan),var(--violet)); color:var(--void); align-self:flex-end; margin-left:auto;"}
    `;
    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  };

  addMsg("🤖 MRZN AI | 7 msgs/day | Full Answers", "bot");
}
