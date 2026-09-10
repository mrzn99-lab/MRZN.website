// ============ KIRA AI BOT WITH ADVANCED FORMATTING ============

const KIRA_AI_CONFIG = {
  API_KEY: 'kira_866b5c11978f670cdb63c235dd6e2187', // শুধু দেখার জন্য ফেক Api
  BASE_URL: 'https://kiraai.vn/api/v1',
  MODEL: 'kira-3.5-flash', // বা kira-2.5-pro
  MAX_TOKENS: 500,
};

class KiraAIBot {
  constructor() {
    this.messageHistory = [];
    this.isTyping = false;
  }

  // ============ ADVANCED FORMATTING ============
  formatResponse(text) {
    let html = text;

    // Bold - **text** → <strong>
    html = html.replace(/\*\*(.*?)\*\*/g, 
      '<strong style="font-weight: 800; color: var(--cyan); letter-spacing: 0.5px;">$1</strong>');
    
    // Italic - *text* → <em>
    html = html.replace(/\*(.*?)\*/g, 
      '<em style="font-style: italic; color: var(--text-dim); font-weight: 500;">$1</em>');
    
    // Code - `text` → <code>
    html = html.replace(/`(.*?)`/g, 
      '<code style="background: rgba(0,229,255,0.1); padding: 3px 8px; border-radius: 4px; font-family: var(--f-mono); font-size: 12px; color: var(--cyan); border: 1px solid rgba(0,229,255,0.2);">$1</code>');
    
    // Headings - ### text → <h3>
    html = html.replace(/^### (.*?)$/gm, 
      '<div style="font-size: 16px; font-weight: 700; color: var(--cyan); margin: 14px 0 8px 0; border-left: 3px solid var(--cyan); padding-left: 10px;">$1</div>');
    
    html = html.replace(/^## (.*?)$/gm, 
      '<div style="font-size: 18px; font-weight: 700; color: var(--text); margin: 18px 0 10px 0;">$1</div>');
    
    html = html.replace(/^# (.*?)$/gm, 
      '<div style="font-size: 20px; font-weight: 800; color: var(--cyan); margin: 20px 0 12px 0; text-transform: uppercase; letter-spacing: 1px;">$1</div>');

    // Bullet points
    html = html.replace(/^[\*\-] (.*?)$/gm, 
      '<div style="margin-left: 20px; margin-bottom: 8px; display: flex; gap: 8px;"><span style="color: var(--cyan); font-weight: 700; flex-shrink: 0;">▸</span><span>$1</span></div>');

    // Numbered list
    html = html.replace(/^(\d+)\. (.*?)$/gm, 
      '<div style="margin-left: 20px; margin-bottom: 8px; display: flex; gap: 8px;"><span style="color: var(--cyan); font-weight: 800; flex-shrink: 0; min-width: 20px;">$1.</span><span>$2</span></div>');

    // Quotes
    html = html.replace(/^> (.*?)$/gm, 
      '<div style="border-left: 4px solid var(--cyan); padding-left: 14px; margin: 12px 0; color: var(--text-dim); font-style: italic; background: rgba(0,229,255,0.05); padding: 12px 14px;">$1</div>');

    // Line break handling
    html = html.replace(/\n\n/g, '</div><div style="margin: 12px 0;">');

    // URLs
    html = html.replace(/https?:\/\/[^\s]+/g, 
      '<a href="$&" target="_blank" style="color: var(--cyan); text-decoration: underline; font-weight: 600;">🔗 Link</a>');

    return `<div style="
      line-height: 1.8;
      color: var(--text);
      font-size: 14px;
      font-family: var(--f-ui), sans-serif;
      word-break: break-word;
    ">${html}</div>`;
  }

  // ============ SEND TO KIRA AI ============
  async sendMessage(userMessage) {
    if (this.isTyping) return;
    this.isTyping = true;

    try {
      console.log('🤖 Kira AI:', userMessage);

      this.messageHistory.push({
        role: 'user',
        content: userMessage
      });

      const response = await fetch(`${KIRA_AI_CONFIG.BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${KIRA_AI_CONFIG.API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: KIRA_AI_CONFIG.MODEL,
          messages: this.messageHistory,
          max_tokens: KIRA_AI_CONFIG.MAX_TOKENS,
          temperature: 0.7,
          top_p: 0.9,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Response:', data);

      const aiMessage = data.choices[0].message.content;

      this.messageHistory.push({
        role: 'assistant',
        content: aiMessage
      });

      return this.formatResponse(aiMessage);

    } catch (error) {
      console.error('❌ Error:', error);
      return this.formatResponse(
        `**⚠️ Error:** ${error.message}\n\n` +
        `**Check:**\n` +
        `- API Key is valid\n` +
        `- Internet connection active\n` +
        `- Token balance available\n\n` +
        `**Help:** Visit https://kiraai.vn/developer/`
      );
    } finally {
      this.isTyping = false;
    }
  }

  clearHistory() {
    this.messageHistory = [];
  }

  getHistory() {
    return this.messageHistory;
  }
}

window.kiraAIBot = new KiraAIBot();
