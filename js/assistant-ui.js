// ============ MRZN AI CHAT UI ============

document.addEventListener('DOMContentLoaded', () => {
  const chatContainer = document.getElementById('ai-chat-container');
  if (!chatContainer) return;

  const chatBox = document.createElement('div');
  chatBox.id = 'mrzn-chat-box';
  chatBox.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 320px;
    max-width: 90vw;
    height: 480px;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    z-index: 999;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  `;

  chatBox.innerHTML = `
    <!-- Header -->
    <div style="
      padding: 12px;
      border-bottom: 1px solid var(--line);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
      background: rgba(0, 229, 255, 0.08);
    ">
      <div style="font-weight: 700; font-size: 14px; color: var(--cyan);">💬 Support</div>
      <button id="mrzn-close-btn" style="
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: var(--text-dim);
      ">✕</button>
    </div>

    <!-- Messages -->
    <div id="mrzn-messages" style="
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 12px;
    "></div>

    <!-- Input -->
    <div style="
      padding: 10px;
      border-top: 1px solid var(--line);
      display: flex;
      gap: 6px;
      flex-shrink: 0;
    ">
      <input type="text" id="mrzn-input" placeholder="Ask about apps..." style="
        flex: 1;
        padding: 8px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: var(--void);
        color: var(--text);
        font-size: 12px;
        font-family: inherit;
      ">
      <button id="mrzn-send-btn" style="
        background: var(--cyan);
        color: var(--void);
        border: none;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 700;
        font-size: 12px;
      ">Send</button>
    </div>
  `;

  chatContainer.appendChild(chatBox);

  const messagesDiv = document.getElementById('mrzn-messages');
  const inputEl = document.getElementById('mrzn-input');
  const sendBtn = document.getElementById('mrzn-send-btn');
  const closeBtn = document.getElementById('mrzn-close-btn');

  // Greeting message
  const greeting = document.createElement('div');
  greeting.style.cssText = `
    align-self: flex-start;
    background: rgba(0,229,255,0.1);
    border: 1px solid rgba(0,229,255,0.2);
    padding: 8px;
    border-radius: 8px;
    font-size: 12px;
    color: var(--text-dim);
  `;
  greeting.textContent = 'Hi! Ask me about MRZN apps and games.';
  messagesDiv.appendChild(greeting);

  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text || sendBtn.disabled) return;

    // User message
    const userMsg = document.createElement('div');
    userMsg.style.cssText = `
      align-self: flex-end;
      background: var(--cyan);
      color: var(--void);
      padding: 8px 10px;
      border-radius: 8px;
      max-width: 85%;
      word-break: break-word;
      font-size: 12px;
    `;
    userMsg.textContent = text;
    messagesDiv.appendChild(userMsg);

    inputEl.value = '';
    sendBtn.disabled = true;
    sendBtn.textContent = '...';

    // AI response
    const response = await window.mrzn_bot.sendMessage(text);

    const aiMsg = document.createElement('div');
    aiMsg.style.cssText = `
      align-self: flex-start;
      background: rgba(8,145,178,0.1);
      border: 1px solid rgba(0,229,255,0.2);
      padding: 8px;
      border-radius: 8px;
      max-width: 85%;
      font-size: 12px;
    `;
    aiMsg.innerHTML = response;
    messagesDiv.appendChild(aiMsg);

    sendBtn.disabled = false;
    sendBtn.textContent = 'Send';
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  sendBtn.addEventListener('click', sendMessage);
  inputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  closeBtn.addEventListener('click', () => {
    chatBox.style.display = 'none';
  });
});
