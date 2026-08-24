/**
 * 💬 AI Chat UI
 */

class AIAssistantUI {
  constructor() {
    this.isReady = false;
    this.init();
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    try {
      const toggleBtn = document.getElementById('helper-bot-toggle');
      const panel = document.getElementById('helper-bot-panel');
      const closeBtn = document.getElementById('helper-bot-close');
      const log = document.getElementById('helper-bot-log');
      const input = document.getElementById('helper-bot-input');
      const sendBtn = document.getElementById('helper-bot-send');
      
      if (!toggleBtn || !panel || !log || !input || !sendBtn) {
        console.warn('⚠️ Chat elements missing');
        return;
      }
      
      this.toggleBtn = toggleBtn;
      this.panel = panel;
      this.closeBtn = closeBtn;
      this.log = log;
      this.input = input;
      this.sendBtn = sendBtn;
      
      this.toggleBtn.onclick = () => this.togglePanel();
      this.closeBtn.onclick = () => this.closePanel();
      this.sendBtn.onclick = () => this.sendMessage();
      this.input.onkeypress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      };
      
      this.isReady = true;
      console.log('✅ Chat UI Ready');
    } catch (error) {
      console.error('Chat setup error:', error);
    }
  }

  togglePanel() {
    if (!this.panel) return;
    if (this.panel.style.display === 'flex') {
      this.closePanel();
    } else {
      this.openPanel();
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
    if (!this.input || !window.mrzn_ai) return;

    const message = this.input.value.trim();
    if (!message) return;

    this.addMessage(message, 'user');
    this.input.value = '';

    try {
      const response = await window.mrzn_ai.processUserQuery(message);
      
      if (response.message) {
        this.addMessage(response.message, 'bot');
      }
      
      if (response.results && response.results.length > 0) {
        response.results.forEach(app => {
          this.addAppCard(app);
        });
      }
    } catch (error) {
      console.error('Send error:', error);
      this.addMessage('❌ Error', 'bot');
    }
  }

  addMessage(text, sender) {
    if (!this.log) return;

    const div = document.createElement('div');
    div.style.marginBottom = '12px';
    div.style.padding = '10px 12px';
    div.style.borderRadius = '8px';
    div.style.maxWidth = '85%';
    div.style.wordBreak = 'break-word';
    div.textContent = text;

    if (sender === 'user') {
      div.style.background = '#00e5ff';
      div.style.color = '#000';
      div.style.marginLeft = 'auto';
      div.style.borderRadius = '8px 0 8px 8px';
    } else {
      div.style.background = '#1a1a2e';
      div.style.color = '#fff';
      div.style.borderRadius = '0 8px 8px 8px';
      div.style.border = '1px solid #333';
    }

    this.log.appendChild(div);
    this.log.scrollTop = this.log.scrollHeight;
  }

  addAppCard(app) {
    if (!this.log) return;

    const card = document.createElement('div');
    card.style.background = 'rgba(0, 229, 255, 0.05)';
    card.style.border = '1px solid #333';
    card.style.borderRadius = '8px';
    card.style.padding = '12px';
    card.style.marginBottom = '10px';
    card.style.marginRight = 'auto';
    card.style.maxWidth = '85%';
    card.style.display = 'flex';
    card.style.gap = '10px';

    const icon = app.icon_url ? 
      `<img src="${app.icon_url}" style="width:40px;height:40px;border-radius:6px;object-fit:cover;">` : '';

    card.innerHTML = `
      ${icon}
      <div style="flex:1;">
        <div style="font-weight:700;color:#00e5ff;font-size:14px;">${app.name}</div>
        <div style="font-size:12px;color:#888;margin-top:4px;">
          ${app.category || 'N/A'} • ⭐ ${(app.rating || 0).toFixed(1)}/5
        </div>
        <a href="app.html?id=${app.id}" style="display:inline-block;margin-top:8px;padding:6px 12px;background:#00e5ff;color:#000;border-radius:4px;text-decoration:none;font-size:12px;font-weight:600;">View</a>
      </div>
    `;

    this.log.appendChild(card);
    this.log.scrollTop = this.log.scrollHeight;
  }
}

// Initialize
if (!window.aiChat) {
  window.aiChat = new AIAssistantUI();
}
