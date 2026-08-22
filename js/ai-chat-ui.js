/**
 * 💬 MRZN AI Chat UI Controller
 * Manages chat interface and user interactions
 */

class AIAssistantUI {
  constructor() {
    this.chatLog = [];
    this.isInitialized = false;
    this.setupWhenReady();
  }

  setupWhenReady() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    try {
      this.setupElements();
      
      if (!this.allElementsReady()) {
        console.warn('⚠️ Chat elements not found, retrying in 500ms...');
        setTimeout(() => this.init(), 500);
        return;
      }
      
      this.setupEventListeners();
      this.isInitialized = true;
      console.log('✅ AI Chat UI Ready');
    } catch (error) {
      console.error('Error initializing chat UI:', error);
      setTimeout(() => this.init(), 1000);
    }
  }

  setupElements() {
    this.toggleBtn = document.getElementById('helper-bot-toggle');
    this.panel = document.getElementById('helper-bot-panel');
    this.closeBtn = document.getElementById('helper-bot-close');
    this.log = document.getElementById('helper-bot-log');
    this.input = document.getElementById('helper-bot-input');
    this.sendBtn = document.getElementById('helper-bot-send');
  }

  allElementsReady() {
    return this.toggleBtn && this.panel && this.closeBtn && 
           this.log && this.input && this.sendBtn;
  }

  setupEventListeners() {
    if (!this.allElementsReady()) return;

    this.toggleBtn.addEventListener('click', () => this.togglePanel());
    this.closeBtn.addEventListener('click', () => this.closePanel());
    this.sendBtn.addEventListener('click', () => this.sendMessage());
    
    this.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
  }

  togglePanel() {
    if (this.panel.style.display === 'none' || this.panel.style.display === '') {
      this.openPanel();
    } else {
      this.closePanel();
    }
  }

  openPanel() {
    if (this.panel) {
      this.panel.style.display = 'flex';
      if (this.input) this.input.focus();
    }
  }

  closePanel() {
    if (this.panel) {
      this.panel.style.display = 'none';
    }
  }

  async sendMessage() {
    if (!this.input) return;

    const message = this.input.value.trim();
    if (!message) return;

    this.addMessage(message, 'user');
    this.input.value = '';
    this.input.focus();

    this.addMessage('', 'bot-typing');

    try {
      if (!window.mrzn_ai) {
        this.removeTypingIndicator();
        this.addMessage('❌ AI not loaded. Refresh the page.', 'bot');
        return;
      }

      const response = await window.mrzn_ai.processUserQuery(message);
      
      this.removeTypingIndicator();
      this.handleResponse(response);
    } catch (error) {
      console.error('Chat error:', error);
      this.removeTypingIndicator();
      this.addMessage('❌ Error: ' + error.message, 'bot');
    }
  }

  handleResponse(response) {
    if (!response) return;

    const { action, message, results, categories, appId } = response;

    if (message) {
      this.addMessage(message, 'bot');
    }

    if (action === 'CATEGORY' && categories) {
      this.addMessage(categories.join(', '), 'bot-code');
    } else if (results && results.length > 0) {
      results.forEach(app => this.addAppResult(app));
    }

    if (action === 'OPEN_SETTINGS') {
      setTimeout(() => {
        window.location.href = 'settings.html';
      }, 1000);
    } else if (action === 'OPEN_UPDATES') {
      setTimeout(() => {
        window.location.href = 'settings.html#updates';
      }, 1000);
    }
  }

  addMessage(text, sender = 'user') {
    if (!this.log) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message chat-${sender}`;
    
    if (sender === 'bot-typing') {
      messageDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
      messageDiv.id = 'typing-indicator';
    } else if (sender === 'bot-code') {
      messageDiv.textContent = text;
      messageDiv.style.fontFamily = 'monospace';
      messageDiv.style.fontSize = '12px';
      messageDiv.style.background = 'rgba(0, 200, 100, 0.1)';
      messageDiv.style.padding = '10px';
      messageDiv.style.borderRadius = '6px';
      messageDiv.style.wordBreak = 'break-word';
    } else {
      messageDiv.textContent = text || '';
      messageDiv.style.wordBreak = 'break-word';
    }
    
    this.log.appendChild(messageDiv);
    this.log.scrollTop = this.log.scrollHeight;
    
    this.chatLog.push({ 
      text, 
      sender, 
      timestamp: new Date() 
    });
  }

  addAppResult(app) {
    if (!this.log || !app) return;

    const resultDiv = document.createElement('div');
    resultDiv.className = 'app-result-card';
    
    const iconHtml = app.icon_url ? 
      `<img src="${app.icon_url}" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover;" onerror="this.style.display='none'">` : '';
    
    resultDiv.innerHTML = `
      <div style="display: flex; gap: 10px; align-items: flex-start;">
        ${iconHtml}
        <div style="flex: 1;">
          <div style="font-weight: 700; color: #00e5ff; font-size: 14px;">${app.name || 'Unknown'}</div>
          <div style="font-size: 12px; color: #888; margin-top: 2px;">
            ${app.category || 'N/A'} • ⭐ ${((app.rating || 0).toFixed(1))}/5
          </div>
          <a href="app.html?id=${app.id}" class="btn-app-detail" style="margin-top: 8px; display: inline-block; padding: 6px 12px; font-size: 12px; background: #00e5ff; color: #000; border-radius: 4px; text-decoration: none; font-weight: 600;">View Details →</a>
        </div>
      </div>
    `;
    
    this.log.appendChild(resultDiv);
    this.log.scrollTop = this.log.scrollHeight;
  }

  removeTypingIndicator() {
    if (!this.log) return;
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }
}

// ============ STYLES ============
const chatStyles = document.createElement('style');
chatStyles.textContent = `
.chat-message {
  margin-bottom: 12px;
  padding: 12px 14px;
  border-radius: 8px;
  max-width: 85%;
  word-wrap: break-word;
  font-size: 14px;
  line-height: 1.4;
  animation: slideIn 0.2s ease-out;
}

.chat-user {
  background: #00e5ff;
  color: #000;
  margin-left: auto;
  border-radius: 8px 0 8px 8px;
}

.chat-bot {
  background: #1a1a2e;
  color: #fff;
  margin-right: auto;
  border-radius: 0 8px 8px 8px;
  border: 1px solid #333;
}

.chat-bot-code {
  background: #1a1a2e;
  color: #fff;
  margin-right: auto;
  border-radius: 0 8px 8px 8px;
  border: 1px solid #333;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 8px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #00e5ff;
  animation: bounce 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {
  0%, 80%, 100% { opacity: 0.3; }
  40% { opacity: 1; }
}

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

.app-result-card {
  background: rgba(0, 229, 255, 0.05);
  border: 1px solid #333;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
  margin-right: auto;
  max-width: 85%;
}

.btn-app-detail:hover {
  background: #0891b2 !important;
}
`;
document.head.appendChild(chatStyles);

// ============ INITIALIZE ============
try {
  window.aiChat = new AIAssistantUI();
  console.log('✅ AI Chat UI Loaded');
} catch (error) {
  console.error('Failed to initialize chat UI:', error);
}
