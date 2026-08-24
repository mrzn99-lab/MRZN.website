/**
 * 💬 Complete AI Chat Interface
 */

class AIChatComplete {
  constructor() {
    this.setupChat();
  }

  setupChat() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    const toggle = document.getElementById('helper-bot-toggle');
    const panel = document.getElementById('helper-bot-panel');
    const close = document.getElementById('helper-bot-close');
    const log = document.getElementById('helper-bot-log');
    const input = document.getElementById('helper-bot-input');
    const send = document.getElementById('helper-bot-send');

    if (!toggle || !panel || !log || !input || !send) {
      console.warn('Chat elements missing');
      return;
    }

    toggle.onclick = () => {
      panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex';
      if (panel.style.display === 'flex') input.focus();
    };

    close.onclick = () => {
      panel.style.display = 'none';
    };

    send.onclick = () => this.sendMessage(input, log);

    input.onkeypress = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage(input, log);
      }
    };

    // Show greeting
    this.addMessage(log, '👋 Hi! I\'m MRZN AI. Type "help" for commands!', 'bot');

    console.log('✅ Chat UI Ready');
  }

  async sendMessage(input, log) {
    const message = input.value.trim();
    if (!message) return;

    this.addMessage(log, message, 'user');
    input.value = '';
    input.focus();

    // Typing indicator
    this.addMessage(log, '', 'typing');

    try {
      if (!window.ollamaAI) {
        this.removeTyping(log);
        this.addMessage(log, '❌ AI not ready', 'bot');
        return;
      }

      const response = await window.ollamaAI.processUserQuery(message);
      this.removeTyping(log);
      this.addMessage(log, response, 'bot');
    } catch (error) {
      console.error('Error:', error);
      this.removeTyping(log);
      this.addMessage(log, '❌ Error: ' + error.message, 'bot');
    }
  }

  addMessage(log, text, sender) {
    const div = document.createElement('div');
    div.style.marginBottom = '12px';
    div.style.padding = '12px 14px';
    div.style.borderRadius = '8px';
    div.style.maxWidth = '85%';
    div.style.wordBreak = 'break-word';
    div.style.lineHeight = '1.5';
    div.style.animation = 'slideIn 0.2s ease';

    if (sender === 'user') {
      div.style.background = '#00e5ff';
      div.style.color = '#000';
      div.style.marginLeft = 'auto';
      div.style.borderRadius = '8px 0 8px 8px';
      div.style.fontWeight = '600';
      div.textContent = text;
    } else if (sender === 'typing') {
      div.id = 'typing-indicator';
      div.innerHTML = '<div style="display:flex;gap:4px;"><span style="width:8px;height:8px;border-radius:50%;background:#00e5ff;animation:bounce 1.4s infinite;"></span><span style="width:8px;height:8px;border-radius:50%;background:#00e5ff;animation:bounce 1.4s infinite 0.2s;"></span><span style="width:8px;height:8px;border-radius:50%;background:#00e5ff;animation:bounce 1.4s infinite 0.4s;"></span></div>';
    } else {
      div.style.background = '#1a1a2e';
      div.style.color = '#fff';
      div.style.border = '1px solid #333';
      div.style.fontSize = '14px';
      div.style.whiteSpace = 'pre-wrap';
      div.textContent = text;
    }

    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

  removeTyping(log) {
    const typing = document.getElementById('typing-indicator');
    if (typing) typing.remove();
  }
}

// Styles
const style = document.createElement('style');
style.textContent = `
@keyframes slideIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes bounce {
  0%, 80%, 100% { opacity: 0.3; }
  40% { opacity: 1; }
}
`;
document.head.appendChild(style);

// Initialize
if (!window.aiChat) {
  window.aiChat = new AIChatComplete();
        }
