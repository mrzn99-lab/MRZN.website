/**
 * 💬 Chat UI - Fixed
 */

class ChatUI {
  constructor() {
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
    const toggle = document.getElementById('helper-bot-toggle');
    const panel = document.getElementById('helper-bot-panel');
    const close = document.getElementById('helper-bot-close');
    const log = document.getElementById('helper-bot-log');
    const input = document.getElementById('helper-bot-input');
    const send = document.getElementById('helper-bot-send');

    if (!toggle || !panel || !log || !input || !send) return;

    toggle.onclick = () => {
      const isOpen = panel.style.display === 'flex';
      panel.style.display = isOpen ? 'none' : 'flex';
      if (!isOpen) input.focus();
    };

    close.onclick = () => panel.style.display = 'none';
    send.onclick = () => this.sendMsg(input, log);

    input.onkeypress = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMsg(input, log);
      }
    };

    // Welcome message (only once)
    if (log.children.length === 0) {
      this.addMsg(log, '👋 Hi! I\'m MRZN AI.\n\n💡 Ask me anything - about apps or general questions!\n\n🎯 Try:\n• "find Termux"\n• "best apps"\n• "help"', 'bot');
    }

    console.log('✅ Chat UI Ready');
  }

  async sendMsg(input, log) {
    const text = input.value.trim();
    if (!text) return;

    this.addMsg(log, text, 'user');
    input.value = '';
    input.focus();

    const typingId = this.showTyping(log);

    try {
      if (!window.generalAI) {
        this.removeTyping(typingId);
        this.addMsg(log, '❌ AI not ready', 'bot');
        return;
      }

      const response = await window.generalAI.processUserQuery(text);
      this.removeTyping(typingId);
      this.addMsg(log, response, 'bot');
    } catch (error) {
      console.error('Error:', error);
      this.removeTyping(typingId);
      this.addMsg(log, '😊 Ask me anything!', 'bot');
    }
  }

  addMsg(log, text, type) {
    const div = document.createElement('div');
    div.style.marginBottom = '12px';
    div.style.padding = '10px 14px';
    div.style.borderRadius = '8px';
    div.style.maxWidth = '85%';
    div.style.wordBreak = 'break-word';
    div.style.lineHeight = '1.5';

    if (type === 'user') {
      div.style.background = '#00e5ff';
      div.style.color = '#000';
      div.style.marginLeft = 'auto';
      div.style.borderRadius = '8px 0 8px 8px';
      div.style.fontWeight = '600';
    } else {
      div.style.background = '#1a1a2e';
      div.style.color = '#fff';
      div.style.border = '1px solid #333';
      div.style.whiteSpace = 'pre-wrap';
    }

    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

  showTyping(log) {
    const id = 'typ' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.style.cssText = 'margin-bottom:12px;padding:10px 14px;background:#1a1a2e;border:1px solid #333;border-radius:8px;width:fit-content';
    div.innerHTML = '<div style="display:flex;gap:4px"><span style="width:6px;height:6px;border-radius:50%;background:#00e5ff;animation:b 1.4s infinite"></span><span style="width:6px;height:6px;border-radius:50%;background:#00e5ff;animation:b 1.4s infinite 0.2s"></span><span style="width:6px;height:6px;border-radius:50%;background:#00e5ff;animation:b 1.4s infinite 0.4s"></span></div>';
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
    return id;
  }

  removeTyping(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }
}

const s = document.createElement('style');
s.textContent = '@keyframes b{0%,80%,100%{opacity:.3}40%{opacity:1}}';
document.head.appendChild(s);

window.chatUI = new ChatUI();
