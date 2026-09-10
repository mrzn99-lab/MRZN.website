// ============ MRZN APPS & GAMES AI BOT - ENHANCED ============

const KIRA_AI_CONFIG = {
  API_KEY: 'kira_866b5c11978f670cdb63c235dd6e2187',
  BASE_URL: 'https://kiraai.vn/api/v1',
  MODEL: 'kira-3.5-flash',
  MAX_TOKENS: 500,
};

const SYSTEM_PROMPT_EN = `You are MRZN Apps & Games smart assistant.
You ONLY answer questions about:
- App features, downloads, reviews, ratings
- Game information, gameplay, tips
- App installation and troubleshooting
- Technical support for our apps
- App recommendations
- https://youtube.com/@mrznapps_games?si=mBW_Ki_xe6fBRhiQ YouTube channel Shere with everyone 
If not about apps/games, politely decline and redirect to app questions.
Always be helpful and friendly.`;

class MRZNAIBot {
  constructor() {
    this.messageHistory = [];
    this.isTyping = false;
    this.messageCount = 0;
  }

  getSystemPrompt() {
    const currentLang = window.languageManager?.currentLang || 'en';
    return currentLang.includes('bn') || currentLang === 'bn' ? SYSTEM_PROMPT_BN : SYSTEM_PROMPT_EN;
  }

  formatResponse(text) {
    let html = text;

    // Bold with glow
    html = html.replace(/\*\*(.*?)\*\*/g, 
      '<strong style="font-weight: 800; color: var(--cyan); text-shadow: 0 0 8px rgba(0,229,255,0.5);">$1</strong>');
    
    // Italic
    html = html.replace(/\*(.*?)\*/g, 
      '<em style="font-style: italic; color: var(--text-dim); font-weight: 500;">$1</em>');
    
    // Code with border
    html = html.replace(/`(.*?)`/g, 
      '<code style="background: linear-gradient(135deg, rgba(0,229,255,0.15) 0%, rgba(0,229,255,0.05) 100%); padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(0,229,255,0.3); font-family: monospace; font-size: 12px; color: var(--cyan); font-weight: 600;">$1</code>');
    
    // Headers with gradient
    html = html.replace(/^### (.*?)$/gm, 
      '<div style="font-size: 14px; font-weight: 800; background: linear-gradient(90deg, var(--cyan) 0%, rgba(0,229,255,0.6) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 12px 0 6px 0; border-left: 3px solid var(--cyan); padding-left: 10px;">$1</div>');
    
    html = html.replace(/^## (.*?)$/gm, 
      '<div style="font-size: 15px; font-weight: 800; color: var(--cyan); margin: 14px 0 8px 0;">$1</div>');

    html = html.replace(/^# (.*?)$/gm, 
      '<div style="font-size: 17px; font-weight: 800; color: var(--cyan); margin: 16px 0 10px 0;">$1</div>');

    // List items with icon
    html = html.replace(/^[\*\-] (.*?)$/gm, 
      '<div style="margin-left: 20px; margin-bottom: 8px; display: flex; gap: 8px; align-items: flex-start;"><span style="color: var(--cyan); font-weight: 800; flex-shrink: 0; margin-top: 2px;">▸</span><span>$1</span></div>');

    // Numbered list
    html = html.replace(/^(\d+)\. (.*?)$/gm, 
      '<div style="margin-left: 20px; margin-bottom: 8px; display: flex; gap: 8px;"><span style="color: var(--cyan); font-weight: 800; flex-shrink: 0; min-width: 20px; background: rgba(0,229,255,0.1); padding: 2px 6px; border-radius: 3px;">$1</span><span>$2</span></div>');

    // Quotes with left border
    html = html.replace(/^> (.*?)$/gm, 
      '<div style="border-left: 4px solid var(--cyan); padding-left: 12px; margin: 12px 0; color: var(--text-dim); font-style: italic; background: rgba(0,229,255,0.05); padding: 12px; padding-left: 12px; border-radius: 6px;">$1</div>');

    return `<div style="
      line-height: 1.7;
      color: var(--text);
      font-size: 13px;
      font-family: var(--f-ui), sans-serif;
      word-break: break-word;
    ">${html}</div>`;
  }

  async sendMessage(userMessage) {
    if (this.isTyping) return;
    this.isTyping = true;
    this.messageCount++;

    try {
      console.log('💬 Message:', userMessage);

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
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt()
            },
            ...this.messageHistory
          ],
          max_tokens: KIRA_AI_CONFIG.MAX_TOKENS,
          temperature: 0.7,
        })
      });

      if (!response.ok) {
        throw new Error('API Error');
      }

      const data = await response.json();
      const aiMessage = data.choices?.[0]?.message?.content || 'No response';

      this.messageHistory.push({
        role: 'assistant',
        content: aiMessage
      });

      return this.formatResponse(aiMessage);

    } catch (error) {
      console.error('Error:', error);
      const msg = window.languageManager?.currentLang?.includes('bn') 
        ? '⚠️ দুঃখিত, আবার চেষ্টা করুন। সংযোগ পরীক্ষা করুন।'
        : '⚠️ Sorry, please try again. Check your connection.';
      return this.formatResponse(msg);
    } finally {
      this.isTyping = false;
    }
  }

  clearHistory() {
    this.messageHistory = [];
    this.messageCount = 0;
  }
}

window.mrzn_bot = new MRZNAIBot();
