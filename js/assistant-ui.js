// ============ MRZN AI CHAT - BEAUTIFUL UI ============

const UI_TEXTS = {
  bn: {
    assistant: 'MRZN সহায়ক',
  },
  en: {
    assistant: 'MRZN Assistant',
    placeholder: 'Ask about apps...',
    send: 'Send',
    greeting: 'Hi! 👋 Ask me about MRZN apps and games.',
    minimize: 'Minimize'
  }
};

function getUIText(key) {
  const lang = window.languageManager?.currentLang || 'en';
  const langCode = lang.includes('bn') ? 'bn' : 'en';
  return UI_TEXTS[langCode][key] || UI_TEXTS.en[key];
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!window.languageManager) {
    setTimeout(() => initChat(), 500);
    return;
  }
  initChat();
});

function initChat() {
  const chatContainer = document.getElementById('ai-chat-container');
  if (!chatContainer) {
    console.error('Chat container not found');
    return;
  }

  // ============ FLOATING BUTTON - MODERN ============
  const floatingBtn = document.createElement('button');
  floatingBtn.id = 'mrzn-floating-btn';
  floatingBtn.innerHTML = '💬';
  floatingBtn.style.cssText = `
    position: fixed;
    bottom: 30px;
    left: 30px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--cyan) 0%, #0099cc 100%);
    border: 2px solid rgba(255,255,255,0.2);
    color: var(--void);
    font-size: 32px;
    cursor: pointer;
    z-index: 998;
    box-shadow: 0 8px 24px rgba(0, 229, 255, 0.35), inset 0 1px 0 rgba(255,255,255,0.2);
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
  `;

  floatingBtn.addEventListener('mouseover', () => {
    floatingBtn.style.transform = 'scale(1.15) translateY(-5px)';
    floatingBtn.style.boxShadow = '0 12px 36px rgba(0, 229, 255, 0.5), inset 0 1px 0 rgba(255,255,255,0.3)';
  });

  floatingBtn.addEventListener('mouseout', () => {
    floatingBtn.style.transform = 'scale(1)';
    floatingBtn.style.boxShadow = '0 8px 24px rgba(0, 229, 255, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)';
  });

  floatingBtn.addEventListener('click', () => {
    console.log('💬 Chat button clicked');
    openChat();
  });

  chatContainer.appendChild(floatingBtn);
  console.log('✅ Floating button created');

  // ============ CHAT BOX - MODERN DESIGN ============
  const chatBox = document.createElement('div');
  chatBox.id = 'mrzn-chat-box';
  chatBox.style.cssText = `
    position: fixed;
    bottom: 30px;
    left: 30px;
    width: 380px;
    max-width: 90vw;
    height: 550px;
    background: linear-gradient(135deg, var(--panel) 0%, rgba(8,145,178,0.05) 100%);
    border: 1px solid rgba(0,229,255,0.2);
    border-radius: 16px;
    display: none;
    flex-direction: column;
    z-index: 999;
    box-shadow: 0 20px 60px rgba(0,0,0,0.35), 0 0 60px rgba(0,229,255,0.15);
    backdrop-filter: blur(20px);
  `;

  chatBox.innerHTML = `
    <!-- Header - Modern -->
    <div style="
      padding: 16px;
      border-bottom: 1px solid rgba(0,229,255,0.15);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
      background: linear-gradient(135deg, rgba(0,229,255,0.1) 0%, transparent 100%);
      border-radius: 16px 16px 0 0;
    ">
      <div>
        <div style="font-weight: 800; font-size: 16px; color: var(--cyan); letter-spacing: 0.5px;">💬 ${getUIText('assistant')}</div>
        <div style="font-size: 11px; color: var(--text-faint); margin-top: 2px;">🟢 Always online</div>
      </div>
      <div style="display: flex; gap: 8px;">
        <button id="mrzn-minimize-btn" style="
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          color: var(--text-dim);
          padding: 4px 8px;
          transition: all 0.2s;
        " title="Minimize">−</button>
        <button id="mrzn-close-btn" style="
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: var(--text-dim);
          padding: 4px 8px;
          transition: all 0.2s;
        " onmouseover="this.style.color='var(--cyan)'" onmouseout="this.style.color='var(--text-dim)'">✕</button>
      </div>
    </div>

    <!-- Messages - Scrollable -->
    <div id="mrzn-messages" style="
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    "></div>

    <!-- Input Area -->
    <div style="
      padding: 12px;
      border-top: 1px solid rgba(0,229,255,0.15);
      display: flex;
      gap: 8px;
      flex-shrink: 0;
      background: rgba(8,145,178,0.03);
    ">
      <input type="text" id="mrzn-input" placeholder="${getUIText('placeholder')}" style="
        flex: 1;
        padding: 10px 14px;
        border: 1px solid rgba(0,229,255,0.2);
        border-radius: 10px;
        background: var(--void);
        color: var(--text);
        font-size: 13px;
        font-family: inherit;
        transition: all 0.2s;
      " onmouseover="this.style.borderColor='var(--cyan)'" onmouseout="this.style.borderColor='rgba(0,229,255,0.2)'">
      <button id="mrzn-send-btn" style="
        background: linear-gradient(135deg, var(--cyan) 0%, #0099cc 100%);
        color: var(--void);
        border: none;
        padding: 10px 16px;
        border-radius: 10px;
        cursor: pointer;
        font-weight: 800;
        font-size: 13px;
        transition: all 0.2s;
        box-shadow: 0 4px 12px rgba(0,229,255,0.2);
      " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 18px rgba(0,229,255,0.35)'" onmouseout="this.style.transform='none'; this.style.boxShadow='0 4px 12px rgba(0,229,255,0.2)'">${getUIText('send')}</button>
    </div>
  `;

  chatContainer.appendChild(chatBox);
  console.log('✅ Chat box created');

  // ============ ELEMENTS ============
  const messagesDiv = document.getElementById('mrzn-messages');
  const inputEl = document.getElementById('mrzn-input');
  const sendBtn = document.getElementById('mrzn-send-btn');
  const closeBtn = document.getElementById('mrzn-close-btn');
  const minimizeBtn = document.getElementById('mrzn-minimize-btn');

  // ============ OPEN CHAT ============
  function openChat() {
    chatBox.style.display = 'flex';
    floatingBtn.style.display = 'none';
    inputEl.focus();

    if (messagesDiv.children.length === 0) {
      const greeting = document.createElement('div');
      greeting.style.cssText = `
        align-self: flex-start;
        background: linear-gradient(135deg, rgba(0,229,255,0.1) 0%, rgba(0,229,255,0.05) 100%);
        border: 1px solid rgba(0,229,255,0.3);
        padding: 12px 14px;
        border-radius: 12px;
        font-size: 13px;
        color: var(--text-dim);
        max-width: 85%;
      `;
      greeting.textContent = getUIText('greeting');
      messagesDiv.appendChild(greeting);
    }
  }

  // ============ CLOSE CHAT ============
  function closeChat() {
    chatBox.style.display = 'none';
    floatingBtn.style.display = 'flex';
  }

  closeBtn.addEventListener('click', closeChat);
  minimizeBtn.addEventListener('click', closeChat);

  // ============ SEND MESSAGE ============
  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text || sendBtn.disabled) return;

    // User message
    const userMsg = document.createElement('div');
    userMsg.style.cssText = `
      align-self: flex-end;
      background: linear-gradient(135deg, var(--cyan) 0%, #0099cc 100%);
      color: var(--void);
      padding: 10px 14px;
      border-radius: 12px;
      max-width: 80%;
      word-break: break-word;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,229,255,0.2);
      animation: slideInRight 0.3s ease;
    `;
    userMsg.textContent = text;
    messagesDiv.appendChild(userMsg);

    inputEl.value = '';
    sendBtn.disabled = true;
    const originalText = sendBtn.textContent;
    sendBtn.textContent = '⏳';

    // AI response
    const response = await window.mrzn_bot.sendMessage(text);

    const aiMsg = document.createElement('div');
    aiMsg.style.cssText = `
      align-self: flex-start;
      background: linear-gradient(135deg, rgba(8,145,178,0.15) 0%, rgba(0,229,255,0.05) 100%);
      border: 1px solid rgba(0,229,255,0.2);
      padding: 12px 14px;
      border-radius: 12px;
      max-width: 80%;
      font-size: 13px;
      box-shadow: 0 4px 12px rgba(0,229,255,0.1);
      animation: slideInLeft 0.3s ease;
    `;
    aiMsg.innerHTML = response;
    messagesDiv.appendChild(aiMsg);

    sendBtn.disabled = false;
    sendBtn.textContent = originalText;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  sendBtn.addEventListener('click', sendMessage);
  inputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // ============ ANIMATIONS ============
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInLeft {
      from {
        opacity: 0;
        transform: translateX(-10px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(10px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    #mrzn-messages::-webkit-scrollbar {
      width: 6px;
    }
    
    #mrzn-messages::-webkit-scrollbar-track {
      background: transparent;
    }
    
    #mrzn-messages::-webkit-scrollbar-thumb {
      background: rgba(0,229,255,0.3);
      border-radius: 3px;
    }
    
    #mrzn-messages::-webkit-scrollbar-thumb:hover {
      background: rgba(0,229,255,0.5);
    }
  `;
  document.head.appendChild(style);

  console.log('✅ Chat fully initialized');
}
