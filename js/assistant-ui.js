// ============ Ai Free 

document.addEventListener('DOMContentLoaded', () => {
  const chatContainer = document.getElementById('ai-chat-container');
  if (!chatContainer) return;

  const chatBox = document.createElement('div');
  chatBox.id = 'kira-chat-box';
  chatBox.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 400px;
    max-width: 95vw;
    height: 650px;
    background: linear-gradient(135deg, var(--panel) 0%, rgba(8,145,178,0.05) 100%);
    border: 1px solid var(--line);
    border-radius: 14px;
    display: flex;
    flex-direction: column;
    z-index: 1000;
    box-shadow: 0 12px 48px rgba(0,0,0,0.4), 0 0 40px rgba(0,229,255,0.1);
    backdrop-filter: blur(10px);
  `;

  chatBox.innerHTML = `
    <!-- Header -->
    <div style="
      padding: 16px;
      border-bottom: 1px solid var(--line);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
      background: linear-gradient(135deg, rgba(0,229,255,0.1) 0%, transparent 100%);
    ">
      <div>
        <div style="font-weight: 700; font-size: 16px; color: var(--cyan);">🤖 Kira AI</div>
        <div style="font-size: 11px; color: var(--text-faint); margin-top: 2px;">Advanced AI Assistant</div>
      </div>
      <button id="kira-close-btn" style="
        background: none;
        border: none;
        font-size: 22px;
        cursor: pointer;
        color: var(--text-dim);
        transition: all 0.2s;
      " onmouseover="this.style.color='var(--cyan)'" onmouseout="this.style.color='var(--text-dim)'">✕</button>
    </div>

    <!-- Messages -->
    <div id="kira-messages" style="
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    "></div>

    <!-- Input -->
    <div style="
      padding: 12px;
      border-top: 1px solid var(--line);
      display: flex;
      gap: 8px;
      flex-shrink: 0;
      background: rgba(0,0,0,0.2);
    ">
      <input type="text" id="kira-input" placeholder="Ask me anything..." style="
        flex: 1;
        padding: 10px 12px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--void);
        color: var(--text);
        font-size: 13px;
        font-family: inherit;
        transition: all 0.2s;
      " onmouseover="this.style.borderColor='var(--cyan)'" onmouseout="this.style.borderColor='var(--line)'">
      <button id="kira-send-btn" style="
        background: linear-gradient(135deg, var(--cyan) 0%, #00e5ff 100%);
        color: var(--void);
        border: none;
        padding: 10px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 700;
        font-size: 13px;
        transition: all 0.2s;
      " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">Send</button>
    </div>
  `;

  chatContainer.appendChild(chatBox);

  const messagesDiv = document.getElementById('kira-messages');
  const inputEl = document.getElementById('kira-input');
  const sendBtn = document.getElementById('kira-send-btn');
  const closeBtn = document.getElementById('kira-close-btn');

  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text || sendBtn.disabled) return;

    // User message
    const userMsg = document.createElement('div');
    userMsg.style.cssText = `
      align-self: flex-end;
      background: linear-gradient(135deg, var(--cyan) 0%, #00e5ff 100%);
      color: var(--void);
      padding: 12px 14px;
      border-radius: 12px;
      max-width: 80%;
      word-break: break-word;
      font-size: 13px;
      font-weight: 500;
      animation: slideIn 0.3s ease;
    `;
    userMsg.textContent = text;
    messagesDiv.appendChild(userMsg);

    inputEl.value = '';
    sendBtn.disabled = true;
    sendBtn.textContent = '...';

    // AI response
    const response = await window.kiraAIBot.sendMessage(text);

    const aiMsg = document.createElement('div');
    aiMsg.style.cssText = `
      align-self: flex-start;
      background: rgba(8,145,178,0.1);
      border: 1px solid rgba(0,229,255,0.3);
      padding: 12px;
      border-radius: 12px;
      max-width: 85%;
      font-size: 13px;
      animation: slideIn 0.3s ease;
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

  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    #kira-messages::-webkit-scrollbar {
      width: 6px;
    }
    
    #kira-messages::-webkit-scrollbar-track {
      background: rgba(0,0,0,0.1);
      border-radius: 3px;
    }
    
    #kira-messages::-webkit-scrollbar-thumb {
      background: var(--cyan);
      border-radius: 3px;
    }
  `;
  document.head.appendChild(style);
});
