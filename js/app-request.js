/**
 * 📝 App Request Modal
 * Handle app suggestions with full database integration
 */

let appRequestFormOpen = false;

function createAppRequestForm() {
  // Line 8: Check if modal already exists
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

  // Line 22: Modal HTML structure
  modal.innerHTML = `
    <div style="
      background: var(--panel);
      border-radius: 12px;
      padding: 24px;
      max-width: 500px;
      width: 100%;
      border: 1px solid var(--line);
      box-shadow: 0 20px 25px rgba(0,0,0,0.3);
    ">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div style="font-weight: 700; font-size: 18px; color: var(--text);">📱 Request an App</div>
        <button id="app-request-close" style="
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: var(--text-dim);
          transition: color 0.2s;
        " onmouseover="this.style.color='var(--text)'" onmouseout="this.style.color='var(--text-dim)'">✕</button>
      </div>

      <!-- Form -->
      <form id="app-request-form" style="display: flex; flex-direction: column; gap: 14px;">
        
        <!-- App Name Input -->
        <div>
          <label style="
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            font-size: 14px;
            color: var(--text);
          ">App Name *</label>
          <input 
            type="text" 
            id="req-app-name" 
            placeholder="e.g., VLC Media Player" 
            style="
              width: 100%;
              padding: 10px 12px;
              border: 1px solid var(--line);
              border-radius: 6px;
              background: var(--void);
              color: var(--text);
              font-size: 14px;
              box-sizing: border-box;
              font-family: inherit;
            " 
            required
          >
        </div>

        <!-- App Link Input -->
        <div>
          <label style="
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            font-size: 14px;
            color: var(--text);
          ">App Link *</label>
          <input 
            type="url" 
            id="req-app-link" 
            placeholder="https://play.google.com/store/apps/..." 
            style="
              width: 100%;
              padding: 10px 12px;
              border: 1px solid var(--line);
              border-radius: 6px;
              background: var(--void);
              color: var(--text);
              font-size: 14px;
              box-sizing: border-box;
              font-family: inherit;
            " 
            required
          >
        </div>

        <!-- Reason Input -->
        <div>
          <label style="
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            font-size: 14px;
            color: var(--text);
          ">Why? (Optional)</label>
          <textarea 
            id="req-app-reason" 
            placeholder="Tell us why this app should be added..." 
            style="
              width: 100%;
              padding: 10px 12px;
              border: 1px solid var(--line);
              border-radius: 6px;
              background: var(--void);
              color: var(--text);
              font-size: 14px;
              box-sizing: border-box;
              min-height: 80px;
              resize: vertical;
              font-family: inherit;
            "
          ></textarea>
        </div>

        <!-- Submit Button -->
        <button 
          type="submit" 
          id="app-request-submit-btn"
          style="
            background: var(--cyan);
            color: var(--void);
            padding: 12px;
            border-radius: 6px;
            border: none;
            font-weight: 700;
            cursor: pointer;
            font-size: 14px;
            transition: opacity 0.2s;
          "
          onmouseover="this.style.opacity='0.9'"
          onmouseout="this.style.opacity='1'"
        >Submit Request</button>
      </form>

      <!-- Status Message -->
      <div id="app-request-status" style="
        margin-top: 12px;
        padding: 12px;
        border-radius: 6px;
        display: none;
        text-align: center;
        font-size: 13px;
        font-weight: 600;
      "></div>
    </div>
  `;

  document.body.appendChild(modal);

  // Line 161: Close button event
  document.getElementById('app-request-close').onclick = closeAppRequestModal;

  // Line 164: Form submit event
  document.getElementById('app-request-form').onsubmit = async (e) => {
    e.preventDefault();
    await submitAppRequest();
  };

  // Line 169: Close on overlay click
  modal.onclick = (e) => {
    if (e.target === modal) {
      closeAppRequestModal();
    }
  };

  console.log('✅ App request form created');
}

// Line 178: Close modal function
function closeAppRequestModal() {
  const modal = document.getElementById('app-request-modal');
  if (modal) {
    modal.style.display = 'none';
    appRequestFormOpen = false;
  }
}

// Line 186: Submit app request function
async function submitAppRequest() {
  try {
    // Line 189: Get input values
    const name = document.getElementById('req-app-name').value.trim();
    const link = document.getElementById('req-app-link').value.trim();
    const reason = document.getElementById('req-app-reason').value.trim();
    const status = document.getElementById('app-request-status');
    const submitBtn = document.getElementById('app-request-submit-btn');

    // Line 197: Validate inputs
    if (!name || !link) {
      showAppRequestStatus('❌ Please fill in App Name and Link', 'error');
      return;
    }

    // Line 202: Show loading state
    status.style.display = 'block';
    status.textContent = '⏳ Submitting...';
    status.style.background = 'rgba(0, 229, 255, 0.1)';
    status.style.color = 'var(--cyan)';
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.5';

    // Line 211: Wait for database to be ready
    console.log('📍 Checking database connection...');
    let dbReady = false;
    let attempts = 0;

    while (!dbReady && attempts < 30) {
      if (window.supabaseClient) {
        console.log('✅ Database ready');
        dbReady = true;
        break;
      }
      attempts++;
      await new Promise(r => setTimeout(r, 100));
    }

    // Line 227: Check database connection
    if (!window.supabaseClient) {
      console.error('❌ Supabase client not initialized');
      showAppRequestStatus('❌ Database not connected. Try again.', 'error');
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
      return;
    }

    // Line 236: Insert into database
    console.log('📤 Inserting request:', { name, link, reason });

    const { data, error } = await window.supabaseClient
      .from('app_requests')
      .insert([
        {
          app_name: name,
          app_link: link,
          reason: reason || null,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ])
      .select();

    // Line 252: Handle database error
    if (error) {
      console.error('❌ Database error:', error);
      
      // Check if table exists
      if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
        showAppRequestStatus('❌ Database table missing. Contact admin.', 'error');
      } else {
        showAppRequestStatus('❌ Error: ' + error.message, 'error');
      }
      
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
      return;
    }

    // Line 268: Success
    console.log('✅ Request submitted successfully');
    showAppRequestStatus('✅ Request submitted! We\'ll review it soon.', 'success');
    
    // Line 272: Clear form
    document.getElementById('app-request-form').reset();
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';
    
    // Line 277: Close after 2.5 seconds
    setTimeout(() => {
      closeAppRequestModal();
    }, 2500);

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    showAppRequestStatus('❌ Error: ' + (err.message || 'Unknown error'), 'error');
    
    const submitBtn = document.getElementById('app-request-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
    }
  }
}

// Line 292: Show status message
function showAppRequestStatus(message, type) {
  const status = document.getElementById('app-request-status');
  if (status) {
    status.textContent = message;
    status.style.display = 'block';
    
    if (type === 'error') {
      status.style.background = 'rgba(220, 38, 38, 0.1)';
      status.style.color = '#fca5a5';
    } else {
      status.style.background = 'rgba(34, 197, 94, 0.1)';
      status.style.color = '#86efac';
    }
  }
}

// Line 309: Open modal function (global)
window.openAppRequestModal = function() {
  console.log('🔓 Opening app request modal');
  
  if (!appRequestFormOpen) {
    createAppRequestForm();
    const modal = document.getElementById('app-request-modal');
    if (modal) {
      modal.style.display = 'flex';
      appRequestFormOpen = true;
      document.getElementById('req-app-name').focus();
    } else {
      console.error('❌ Modal not created');
    }
  }
};

// Line 327: Initialize on page load
function initAppRequest() {
  console.log('🔧 Initializing app request...');
  createAppRequestForm();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAppRequest);
} else {
  initAppRequest();
}
