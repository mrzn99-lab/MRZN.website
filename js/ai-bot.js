class AIBot {
  constructor() {
    this.chatHistory = [];
    this.isLoading = false;
    this.groqKey = "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";
  }

  async sendMessage(msg) {
    this.isLoading = true;
    try {
      this.chatHistory.push({ role: "user", content: msg });
      
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.groqKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: "You are MRZN Apps & Games AI Assistant. Only discuss apps and games. Be honest. Never make up data."
            },
            ...this.chatHistory
          ],
          max_tokens: 1024
        })
      });

      const data = await res.json();
      const reply = data.choices[0].message.content;
      this.chatHistory.push({ role: "assistant", content: reply });
      return { text: reply, success: true };
    } catch (err) {
      return { text: "❌ Error: " + err.message, success: false };
    } finally {
      this.isLoading = false;
    }
  }
}

let bot = null;

document.addEventListener("DOMContentLoaded", function() {
  bot = new AIBot();
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

  toggle.addEventListener("click", function() {
    panel.style.display = "flex";
    input.focus();
  });

  close?.addEventListener("click", function() {
    panel.style.display = "none";
  });

  send.addEventListener("click", sendMsg);
  input.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMsg();
    }
  });

  async function sendMsg() {
    const text = input.value.trim();
    if (!text || bot.isLoading) return;

    input.value = "";
    addMsg(text, "user");
    send.disabled = true;
    send.textContent = "Thinking...";

    const res = await bot.sendMessage(text);
    addMsg(res.text, "bot");

    send.disabled = false;
    send.textContent = "Send";
    input.focus();
  }

  function addMsg(text, type) {
    const div = document.createElement("div");
    div.style.cssText = "max-width:80%; margin:8px 0; padding:11px 15px; border-radius:14px; font-size:14px; word-break:break-word; " +
      (type === "bot"
        ? "background:var(--panel-2); color:var(--text); align-self:flex-start;"
        : "background:linear-gradient(135deg,var(--cyan),var(--violet)); color:var(--void); align-self:flex-end; margin-left:auto;");
    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

  addMsg("🤖 MRZN AI Assistant! Ask me about Apps & Games.", "bot");
           }
