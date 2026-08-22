/**
 * 💬 MRZN AI Chat UI Controller
 * Manages chat interface and user interactions
 */

class AIAssistantUI {
  constructor() {
    this.chatLog = [];
    this.init();
  }

  init() {
    this.setupElements();
    this.setupEventListeners();
    console.log('✅ AI Chat UI Ready');
  }

  setupElements() {
    this.toggleBtn = document.getElementById('helper-bot-toggle');
    this.panel = document.getElementById('helper-bot-panel');
    this.closeBtn = document.getElementById('helper-bot-close');
    this.log = document.getElementById('helper-bot-log');
    this.input = document.getElementById('helper-bot-input');
    this.sendBtn = document.getElementById('helper-bot-send');
  }

  setupEventListeners() {
    if (this.toggleBtn) this.toggleBtn.addEventListener('click', () => this.togglePanel());
    if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.closePanel());
    if (this.sendBtn) this.sendBtn.addEventListener('click', () => this.sendMessage());
    if (this.input) {
      this.input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }
  }

  togglePanel() {
    if (this.panel.style.display === 'none') {
      this.openPanel();
    } else {
      this.closePanel();
    }
  }

  openPanel() {
    this.panel.style.display = 'flex';
    if (this.input) this.input.focus();
  }

  closePanel() {
    this.panel.style.display = 'none';
  }

  async sendMessage() {
    const message = this.input.value.trim();
    if (!message) return;

    // Add user message
    this.addMessage(message, 'user');
    this.input.value = '';
    this.input.focus();

    // Show typing indicator
    this.addMessage('', 'bot-typing');

    // Process with AI
    try {
      if (!window.mrzn_ai) {
        this.addMessage('❌ AI assistant not ready. Please refresh the page.', 'bot');
        return;
      }

      const response = await window.mrzn_ai.processUserQuery(message);
      
      // Remove typing indicator
      this.removeTypingIndicator();

      // Handle different action types
      if (response.action === 'SEARCH' || response.action === 'RECOMMEND' || 
          response.action === 'TRENDING' || response.action === 'DETAIL' ||
          response.action === 'COMPARE' || response.action === 'RATING' ||
          response.action === 'APK_ANALYSIS' || response.action === 'OPEN_APP') {
        
        this.addMessage(response.message, 'bot');
        
        if (response.results && response.results.length > 0) {
          response.results.forEach(app => {
            this.addAppResult(app);
          });
        }
      } else if (response.action === 'CATEGORY') {
        this.addMessage(response.message, 'bot');
        if (response.categories) {
          this.addMessage(response.categories.join(', '), 'bot-code');
        }
      } else if (response.action === 'SET_THEME') {
        this.addMessage(response.message, 'bot');
        window.location.href = 'settings.html#appearance';
      } else if (response.action === 'OPEN_SETTINGS') {
        this.addMessage(response.message, 'bot');
        window.location.href = 'settings.html';
      } else if (response.action === 'OPEN_UPDATES') {
        this.addMessage(response.message, 'bot');
        window.location.href = 'settings.html#updates';
      } else if (response.action === 'STATUS') {
        this.addMessage(response.message, 'bot');
      }
    } catch (error) {
      console.error('AI Error:', error);
      this.removeTypingIndicator();
      this.addMessage('❌ Error processing query. Try again.', 'bot');
    }
  }

  addMessage(text, sender = 'user') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message chat-${sender}`;
    
    if (sender === 'bot-typing') {
      messageDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
      messageDiv.id = 'typing-indicator';
    } else if (sender === 'bot-code') {
      messageDiv.textContent = text;
      messageDiv.style.fontFamily = 'var(--f-mono)';
      messageDiv.style.fontSize = '12px';
      messageDiv.style.background = 'rgba(0, 200, 100, 0.1)';
      messageDiv.style.padding = '10px';
      messageDiv.style.borderRadius = '6px';
    } else {
      messageDiv.textContent = text;
    }
    
    this.log.appendChild(messageDiv);
    this.log.scrollTop = this.log.scrollHeight;
    this.chatLog.push({ text, sender, timestamp: new Date() });
  }

  addAppResult(app) {
    const resultDiv = document.createElement('div');
    resultDiv.className = 'app-result-card';
    resultDiv.innerHTML = `
      <div style="display: flex; gap: 10px; align-items: flex-start;">
        ${app.icon_url ? `<img src="${app.icon_url}" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover;" onerror="this.style.display='none'">` : ''}
        <div style="flex: 1;">
          <div style="font-weight: 700; color: var(--cyan); font-size: 14px;">${app.name}</div>
          <div style="font-size: 12px; color: var(--text-faint); margin-top: 2px;">
            ${app.category} • ⭐ ${(app.rating || 0).toFixed(1)}/5
          </div>
          <a href="app.html?id=${app.id}" class="btn btn-primary btn-xs" style="margin-top: 8px; display: inline-block; padding: 6px 12px; font-size: 12px;">View Details →</a>
        </div>
      </div>
    `;
    
    this.log.appendChild(resultDiv);
    this.log.scrollTop = this.log.scrollHeight;
  }

  removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
  }
}

// ============ STYLES ============
const chatStyles = `
<style>
.chat-message {
  margin-bottom: 12px;
  padding: 12px 14px;
  border-radius: 8px;
  max-width: 85%;
  word-wrap: break-word;
  font-size: 14px;
  line-height: 1.4;
}

.chat-user {
  background: var(--cyan);
  color: var(--void);
  margin-left: auto;
  border-radius: 8px 0 8px 8px;
}

.chat-bot {
  background: var(--line);
  color: var(--text);
  margin-right: auto;
  border-radius: 0 8px 8px 8px;
}

.chat-bot-code {
  background: var(--line);
  color: var(--text);
  margin-right: auto;
  border-radius: 0 8px 8px 8px;
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
  background: var(--cyan);
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

.app-result-card {
  background: rgba(8, 145, 178, 0.1);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
  margin-right: auto;
  max-width: 85%;
}

.btn-xs {
  padding: 4px 8px;
  font-size: 11px;
}
</style>
`;

// ============ INITIALIZE ============
document.head.insertAdjacentHTML('beforeend', chatStyles);
window.aiChat = new AIAssistantUI();
console.log('✅ AI Chat UI Loaded');
