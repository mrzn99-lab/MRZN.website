//Ui interface 
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
