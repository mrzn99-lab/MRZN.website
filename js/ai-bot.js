class AIBot {
  constructor() {
    this.chatHistory = [];
    this.isLoading = false;
    this.groqKey = "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";
  }

  async sendMessage(userMessage) {
    this.isLoading = true;

    try {
      this.chatHistory.push({ role: "user", content: userMessage });

      const requestBody = {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are the AI Assistant for MRZN Apps & Games website. Your primary responsibilities are:

1. Search and find Apps/Games for users
2. Show Apps/Games by Category
3. Provide detailed information about specific Apps/Games
4. Compare two or multiple Apps/Games side-by-side
5. Recommend Apps/Games based on user requirements
6. Provide information about ratings and reviews
7. Explain App permissions
8. Give honest security assessment of Apps/APKs
9. Show trending and popular Apps/Games
10. Explain APK analysis results
11. Help users understand MRZN Apps/Games catalogue

Important Rules:
1. Never make up information if App data is not in database/context
2. Clearly state "Information not available" for unknown data
3. Never claim 100% safe or 100% malware-free unless reliable scans exist
4. Don't claim APK analysis was done if results aren't available
5. Never fabricate ratings, downloads, size, permissions
6. Ask for clarification if user question is unclear
7. Note uncertainty when providing info about apps outside our website
8. Use catalogue/context data first when user asks about specific apps
9. Consider previous context if user asks same question repeatedly
10. Never make false claims about your capabilities

IMPORTANT: Only discuss Apps and Games. Do not introduce any other topics.

Response Languages: Reply in the same language user asks - Bengali, English, or Banglish.`
          },
          ...this.chatHistory
        ],
        temperature: 0.7,
        max_tokens: 1024
      };

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.groqKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Invalid response from API");
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
    sendBtn.textContent = "Thinking...";

    const res = await aiBot.sendMessage(text);
    addBubble(res.text, "bot");

    sendBtn.disabled = false;
    sendBtn.textContent = "Send";
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

  addBubble("🤖 MRZN AI Assistant! Ask me anything about Apps & Games.", "bot");
}
