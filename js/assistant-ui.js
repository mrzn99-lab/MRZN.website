/*
  AI Assistant - User Interface
  Renders chat panel with messages
*/

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("helper-bot-toggle");
  const panel = document.getElementById("helper-bot-panel");
  const input = document.getElementById("helper-bot-input");
  const log = document.getElementById("helper-bot-log");
  const sendBtn = document.getElementById("helper-bot-send");

  if (!toggle || !panel || !mrzn_ai_assistant) return;

  // Open panel
  toggle.addEventListener("click", () => {
    panel.style.display = "flex";
    input.focus();
  });

  // Send message
  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    // Clear input
    input.value = "";

    // Add user message to UI
    addMessageToUI(text, "user");

    // Get AI response
    sendBtn.disabled = true;
    sendBtn.textContent = "চিন্তা করছি...";

    try {
      const response = await mrzn_ai_assistant.handleUserMessage(text);
      
      // Add bot response to UI
      addMessageToUI(response.text, "bot");
      if (response.html) {
        addHTMLToUI(response.html, "bot");
      }
    } catch (err) {
      addMessageToUI("❌ কিছু ত্রুটি হয়েছে। আবার চেষ্টা করুন।", "bot");
      console.error(err);
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = "পাঠান";
    }
  }

  function addMessageToUI(text, type) {
    const bubble = document.createElement("div");
    bubble.className = type === "user" ? "ai-msg-user" : "ai-msg-bot";
    bubble.textContent = text;
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
  }

  function addHTMLToUI(html, type) {
    const bubble = document.createElement("div");
    bubble.className = type === "user" ? "ai-msg-user" : "ai-msg-bot";
    bubble.innerHTML = html;
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
  }

  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  // Welcome message
  addMessageToUI("🤖 MRZN এআই এসিস্ট্যান্ট এ স্বাগতম! কোন app খুঁজছেন?", "bot");
});
