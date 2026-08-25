/**
 * App Request Modal
 */

let appRequestFormOpen = false;

function createAppRequestForm() {
  if (document.getElementById('app-request-modal')) return;

  const modal = document.createElement('div');
  modal.id = 'app-request-modal';
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.7);
    z-index: 500;
    display: none;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;

  modal.innerHTML = `
    <div style="
      background: var(--panel);
      border-radius: 12px;
      padding: 24px;
      max-width: 500px;
      width: 100%;
      border: 1px solid var(--line);
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div style="font-weight: 700; font-size: 18px;">📱 Request an App</div>
        <button id="app-request-close" style="
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: var(--text-dim);
        ">✕</button>
      </div>

      <form id="app-request-form" style="display: flex; flex-direction: column; gap: 14px;">
        <div>
          <label style="
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            font-size: 14px;
          ">App Name *</label>
          <input type="text" id="req-app-name" placeholder="e.g., VLC Media Player" style="
            width: 100%;
            padding: 10px;
            border: 1px solid var(--line);
            border-radius: 6px;
            background: var(--void);
            color: var(--text);
            font-size: 14px;
            box-sizing: border-box;
          " required>
        </div>

        <div>
          <label style="
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            font-size: 14px;
          ">App Link *</label>
          <input type="url" id="req-app-link" placeholder="https://play.google.com/..." style="
            width: 100%;
            padding: 10px;
            border: 1px solid var(--line);
            border-radius: 6px;
            background: var(--void);
            color: var(--text);
            font-size: 14px;
            box-sizing: border-box;
          " required>
        </div>

        <div>
          <label style="
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            font-size: 14px;
          ">Why? (Optional)</label>
          <textarea id="req-app-reason" placeholder="Tell us why this app should be added..." style="
            width: 100%;
            padding: 10px;
            border: 1px solid var(--line);
            border-radius: 6px;
            background: var(--void);
            color: var(--text);
            font-size: 14px;
            box-sizing: border-box;
            min-height: 80px;
            resize: vertical;
          "></textarea>
        </div>

        <button type="submit" style="
          background: var(--cyan);
          color: var(--void);
          padding: 12px;
          border-radius: 6px;
          border: none;
          font-weight: 700;
          cursor: pointer;
          font-size: 14px;
        ">Submit Request</button>
      </form>

      <div id="app-request-status" style="
        margin-top: 12px;
        padding: 12px;
        border-radius: 6px;
        display: none;
        text-align: center;
        font-size: 13px;
      "></div>
    </div>
  `;

  document.body.appendChild(modal);

  // Events
  document.getElementById('app-request-close').onclick = () => {
    modal.style.display = 'none';
    appRequestFormOpen = false;
  };

  document.getElementById('app-request-form').onsubmit = async (e) => {
    e.preventDefault();
    await submitAppRequest();
  };

  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
      appRequestFormOpen = false;
    }
  };
}

async function submitAppRequest() {
  try {
    const name = document.getElementById('req-app-name').value.trim();
    const link = document.getElementById('req-app-link').value.trim();
    const reason = document.getElementById('req-app-reason').value.trim();
    const status = document.getElementById('app-request-status');

    if (!name || !link) {
      showStatus('❌ Please fill all required fields', 'error');
      return;
    }

    status.style.display = 'block';
    status.textContent = '⏳ Submitting...';
    status.style.background = 'rgba(0, 229, 255, 0.1)';
    status.style.color = 'var(--cyan)';

    if (!window.supabaseClient) {
      showStatus('❌ Database not connected', 'error');
      return;
    }

    const { error } = await window.supabaseClient
      .from('app_requests')
      .insert({
        app_name: name,
        app_link: link,
        reason: reason,
        status: 'pending',
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Submit error:', error);
      showStatus('❌ Error: ' + error.message, 'error');
      return;
    }

    showStatus('✅ Request submitted! Thanks for suggesting.', 'success');
    
    // Clear form
    document.getElementById('app-request-form').reset();
    
    // Close after 2 seconds
    setTimeout(() => {
      const modal = document.getElementById('app-request-modal');
      if (modal) modal.style.display = 'none';
      appRequestFormOpen = false;
    }, 2000);

  } catch (err) {
    console.error('Error:', err);
    showStatus('❌ Error: ' + err.message, 'error');
  }
}

function showStatus(message, type) {
  const status = document.getElementById('app-request-status');
  if (status) {
    status.textContent = message;
    status.style.display = 'block';
    status.style.background = type === 'error' 
      ? 'rgba(220, 38, 38, 0.1)' 
      : 'rgba(34, 197, 94, 0.1)';
    status.style.color = type === 'error' ? '#fca5a5' : '#86efac';
  }
}

window.openAppRequestModal = function() {
  if (!appRequestFormOpen) {
    createAppRequestForm();
    const modal = document.getElementById('app-request-modal');
    if (modal) {
      modal.style.display = 'flex';
      appRequestFormOpen = true;
    }
  }
};

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createAppRequestForm);
} else {
  createAppRequestForm();
}
