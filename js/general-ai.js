// ============ MRZN APPS & GAMES AI BOT ============

const KIRA_AI_CONFIG = {
  API_KEY: 'kira_866b5c11978f670cdb63c235dd6e2187', // fack Api key only for try
  BASE_URL: 'https://kiraai.vn/api/v1',
  MODEL: 'kira-3.5-flash',
  MAX_TOKENS: 300,
};

const SYSTEM_PROMPT = `You are a helpful assistant for MRZN Apps & Games website. 
You ONLY answer questions about:
- Apps and games available on MRZN
- App features, downloads, reviews
- Game information and gameplay
- App recommendations
- Technical support for our apps
- YouTube channel link: https://youtube.com/@mrznapps_games?si=mLfcVGlp9Eaohu86 shere with everyone.
If the user asks anything NOT related to apps or games, politely decline and redirect them to ask about MRZN apps and games.`;

class MRZNAIBot {
  constructor() {
    this.messageHistory = [];
    this.isTyping = false;
  }

  formatResponse(text) {
    let html = text;

    html = html.replace(/\*\*(.*?)\*\*/g, 
      '<strong style="font-weight: 700; color: var(--cyan);">$1</strong>');
    
    html = html.replace(/\*(.*?)\*/g, 
      '<em style="font-style: italic; color: var(--text-dim);">$1</em>');
    
    html = html.replace(/`(.*?)`/g, 
      '<code style="background: rgba(0,229,255,0.1); padding: 2px 6px; border-radius: 3px; font-family: monospace; font-size: 12px; color: var(--cyan);">$1</code>');
    
    html = html.replace(/^### (.*?)$/gm, 
      '<div style="font-size: 14px; font-weight: 700; color: var(--cyan); margin: 10px 0 6px 0;">$1</div>');
    
    html = html.replace(/^## (.*?)$/gm, 
      '<div style="font-size: 15px; font-weight: 700; color: var(--text); margin: 12px 0 8px 0;">$1</div>');

    html = html.replace(/^[\*\-] (.*?)$/gm, 
      '<div style="margin-left: 16px; margin-bottom: 6px;"><span style="color: var(--cyan); font-weight: 700;">▸</span> $1</div>');

    html = html.replace(/^(\d+)\. (.*?)$/gm, 
      '<div style="margin-left: 16px; margin-bottom: 6px;"><span style="color: var(--cyan); font-weight: 700;">$1.</span> $2</div>');

    html = html.replace(/^> (.*?)$/gm, 
      '<div style="border-left: 3px solid var(--cyan); padding-left: 10px; margin: 8px 0; color: var(--text-dim); font-size: 12px;">$1</div>');

    return `<div style="line-height: 1.6; color: var(--text); font-size: 12px;">${html}</div>`;
  }

  async sendMessage(userMessage) {
    if (this.isTyping) return;
    this.isTyping = true;

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
              content: SYSTEM_PROMPT
            },
            ...this.messageHistory
          ],
          max_tokens: KIRA_AI_CONFIG.MAX_TOKENS,
          temperature: 0.7,
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'API Error');
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
      return this.formatResponse('Sorry, I encountered an error. Please try again or ask about our apps and games.');
    } finally {
      this.isTyping = false;
    }
  }

  clearHistory() {
    this.messageHistory = [];
  }
}

window.mrzn_bot = new MRZNAIBot();
