/**
 * 📰 Updates Menu System
 * Shows updates in a sidebar menu
 */

class UpdatesMenu {
  constructor() {
    this.isOpen = false;
    this.init();
  }

  async init() {
    try {
      // Create menu button
      this.createMenuButton();
      
      // Create updates panel
      this.createUpdatesPanel();
      
      // Load updates
      await this.loadUpdates();
      
      console.log('✅ Updates Menu Ready');
    } catch (error) {
      console.error('Updates menu error:', error);
    }
  }

  createMenuButton() {
    const menuBtn = document.createElement('button');
    menuBtn.id = 'updates-menu-btn';
    menuBtn.innerHTML = '📰 Updates';
    menuBtn.style.cssText = `
      padding: 8px 16px;
      background: #00e5ff;
      color: #000;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      margin-top: 10px;
      width: 100%;
      box-sizing: border-box;
    `;
    menuBtn.onclick = () => this.toggleMenu();
    
    // Find navbar and add button
    const navUser = document.getElementById('nav-auth-slot');
    if (navUser && navUser.parentElement) {
      navUser.parentElement.insertBefore(menuBtn, navUser.nextSibling);
    }
  }

  createUpdatesPanel() {
    const panel = document.createElement('div');
    panel.id = 'updates-panel';
    panel.style.cssText = `
      position: fixed;
      right: -400px;
      top: 0;
      width: 380px;
      height: 100vh;
      background: linear-gradient(135deg, #0f1419 0%, #1a1f2e 100%);
      border-left: 1px solid #333;
      z-index: 250;
      transition: right 0.3s ease;
      overflow-y: auto;
      box-shadow: -4px 0 20px rgba(0, 0, 0, 0.5);
    `;

    panel.innerHTML = `
      <div style="padding: 20px; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center;">
        <div style="font-weight: 700; font-size: 18px; color: #00e5ff;">📰 Updates</div>
        <button id="updates-close-btn" style="background: none; border: none; font-size: 24px; color: #888; cursor: pointer;">✕</button>
      </div>
      <div id="updates-list" style="padding: 20px;">
        <div style="text-align: center; color: #888;">Loading...</div>
      </div>
    `;

    document.body.appendChild(panel);

    // Close button
    document.getElementById('updates-close-btn').onclick = () => this.toggleMenu();
  }

  toggleMenu() {
    const panel = document.getElementById('updates-panel');
    if (!panel) return;

    this.isOpen = !this.isOpen;
    panel.style.right = this.isOpen ? '0' : '-400px';
  }

  async loadUpdates() {
    try {
      if (!window.supabaseClient) {
        console.warn('Supabase not ready');
        return;
      }

      const { data: updates } = await window.supabaseClient
        .from('website_updates')
        .select('id, title, description, image_url, published_date, version')
        .eq('status', 'published')
        .order('published_date', { ascending: false })
        .limit(20);

      const list = document.getElementById('updates-list');
      if (!list) return;

      if (!updates || updates.length === 0) {
        list.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">No updates yet</div>';
        return;
      }

      list.innerHTML = updates.map(update => `
        <div style="background: rgba(0, 229, 255, 0.05); border: 1px solid #333; border-radius: 10px; padding: 15px; margin-bottom: 15px;">
          ${update.image_url ? `
            <img src="${update.image_url}" alt="Update" style="width: 100%; height: 180px; object-fit: cover; border-radius: 8px; margin-bottom: 12px;">
          ` : ''}
          <div style="font-weight: 700; color: #00e5ff; font-size: 16px; margin-bottom: 8px;">${update.title}</div>
          <div style="font-size: 13px; color: #aaa; line-height: 1.5; margin-bottom: 10px;">${update.description}</div>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #888;">
            <span>${new Date(update.published_date).toLocaleDateString()}</span>
            ${update.version ? `<span style="background: #00e5ff; color: #000; padding: 2px 8px; border-radius: 4px; font-weight: 600;">${update.version}</span>` : ''}
          </div>
        </div>
      `).join('');
    } catch (error) {
      console.error('Load updates error:', error);
    }
  }
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new UpdatesMenu();
  });
} else {
  new UpdatesMenu();
}
