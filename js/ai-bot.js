class AIBot {
  constructor() {
    this.chatHistory = [];
    this.isLoading = false;
    this.apiUrl = "https://YOUR_PROJECT_ID.supabase.co/functions/v1/chat";
  }

  async sendMessage(userMessage) {
    this.isLoading = true;

    try {
      this.chatHistory.push({ role: "user", content: userMessage });

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          chatHistory: this.chatHistory.slice(-5)
        })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      if (!data.success) throw new Error(data.error);

      this.chatHistory.push({ role: "assistant", content: data.response });

      return { text: data.response, success: true };

    } catch (err) {
      return { text: `❌ Error: ${err.message}`, success: false };
    } finally {
      this.isLoading = false;
    }
  }
}

let aiBot = null;

document.addEventListener("DOMContentLoaded", () => {
  aiBot = new AIBot();
  setupBotUI();
});

function setupBotUI() {
  const toggle = document.getElementById("helper-bot-toggle");
  const panel = document.getElementById("helper-bot-panel");
  const closeBtn = document.getElementById("helper-bot-close");
  const input = document.getElementById("helper-bot-input");
  const log = document.getElementById("helper-bot-log");
  const sendBtn = document.getElementById("helper-bot-send");

  if (!toggle) return;

  toggle.addEventListener("click", () => panel.style.display = "flex");
  closeBtn?.addEventListener("click", () => panel.style.display = "none");

  async function sendMessage() {
    const text = input.value.trim();
    if (!text || aiBot.isLoading) return;

    input.value = "";
    addBubble(text, "user");
    sendBtn.disabled = true;
    sendBtn.textContent = "চিন্তা করছি...";

    const res = await aiBot.sendMessage(text);
    addBubble(res.text, "bot");

    sendBtn.disabled = false;
    sendBtn.textContent = "পাঠান";
    input.focus();
  }

  function addBubble(text, type) {
    const div = document.createElement("div");
    div.style.cssText = `
      max-width:80%; margin:8px 0; padding:11px 15px; border-radius:14px;
      font-size:14px; word-break:break-word;
      ${type === "bot"
        ? "background:var(--panel-2); color:var(--text); align-self:flex-start;"
        : "background:linear-gradient(135deg,var(--cyan),var(--violet)); color:var(--void); align-self:flex-end; margin-left:auto;"}
    `;
    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  addBubble("🤖 MRZN AI Assistant! যেকোনো প্রশ্ন করুন।", "bot");
    }
