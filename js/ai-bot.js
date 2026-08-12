class AIBot {
  constructor() {
    this.chatHistory = [];
    this.isLoading = false;
    // আপনার Groq key এখানে
    this.groqKey = "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";
  }

  async sendMessage(userMessage) {
    this.isLoading = true;

    try {
      this.chatHistory.push({ role: "user", content: userMessage });

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.groqKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-70b-versatile",
          messages: [
            {
              role: "system",
              content: "আপনি MRZN Apps & Games এর AI assistant। যেকোনো ভাষায় সাহায্য করুন।"
            },
            ...this.chatHistory
          ],
          temperature: 0.7,
          max_tokens: 1024
        })
      });

      if (!response.ok) {
        throw new Error(`Groq error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Invalid response format");
      }

      const aiResponse = data.choices[0].message.content;
      this.chatHistory.push({ role: "assistant", content: aiResponse });

      return { text: aiResponse, success: true };

    } catch (err) {
      console.error("Error:", err);
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

  toggle.addEventListener("click", () => {
    panel.style.display = "flex";
    input.focus();
  });

  closeBtn?.addEventListener("click", () => {
    panel.style.display = "none";
  });

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
      font-size:14px; line-height:1.6; word-break:break-word;
      ${type === "bot"
        ? "background:var(--panel-2); color:var(--text); align-self:flex-start; border-bottom-left-radius:3px;"
        : "background:linear-gradient(135deg,var(--cyan),var(--violet)); color:var(--void); align-self:flex-end; margin-left:auto; border-bottom-right-radius:3px;"}
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
