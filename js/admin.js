/**
 * 📊 Admin Panel - App Requests Management
 */

// Line 1: Initialize admin panel
async function initAdminPanel() {
  console.log('⚙️ Loading admin panel...');
  
  // Load both apps and requests
  await loadAppsList();
  await loadAdminUpdates();
  await loadAppRequests(); // NEW
}

// Line 10: Load app requests
async function loadAppRequests() {
  try {
    if (!window.supabaseClient) {
      console.warn('Database not ready');
      return;
    }

    const { data: requests, error } = await window.supabaseClient
      .from('app_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Load error:', error);
      return;
    }

    const container = document.getElementById('app-requests-list');
    if (!container) {
      console.warn('Container not found - will create it');
      createRequestsSection();
      return;
    }

    // Line 38: Render requests
    if (!requests || requests.length === 0) {
      container.innerHTML = '<div style="text-align: center; color: var(--text-faint); padding: 20px;">No app requests yet</div>';
      return;
    }

    container.innerHTML = `
      <div style="overflow-x: auto;">
        <table class="admin-table" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid var(--line);">
              <th style="padding: 12px; text-align: left; font-weight: 600;">App Name</th>
              <th style="padding: 12px; text-align: left; font-weight: 600;">Link</th>
              <th style="padding: 12px; text-align: left; font-weight: 600;">Reason</th>
              <th style="padding: 12px; text-align: left; font-weight: 600;">Date</th>
              <th style="padding: 12px; text-align: left; font-weight: 600;">Status</th>
              <th style="padding: 12px; text-align: center; font-weight: 600;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${requests.map(req => `
              <tr style="border-bottom: 1px solid var(--line); hover: background: var(--line);">
                <td style="padding: 12px; font-weight: 600;">${req.app_name || 'N/A'}</td>
                <td style="padding: 12px;">
                  <a href="${req.app_link}" target="_blank" rel="noopener" style="color: var(--cyan); text-decoration: none; word-break: break-all;">
                    ${req.app_link?.substring(0, 50) || 'N/A'}...
                  </a>
                </td>
                <td style="padding: 12px; max-width: 200px; overflow: hidden; text-overflow: ellipsis;">
                  ${req.reason ? req.reason.substring(0, 50) : 'N/A'}
                </td>
                <td style="padding: 12px; font-size: 13px; color: var(--text-dim);">
                  ${new Date(req.created_at).toLocaleDateString()}
                </td>
                <td style="padding: 12px;">
                  <select onchange="updateRequestStatus(${req.id}, this.value)" style="
                    background: var(--void);
                    color: var(--text);
                    border: 1px solid var(--line);
                    padding: 6px;
                    border-radius: 4px;
                    cursor: pointer;
                  ">
                    <option value="pending" ${req.status === 'pending' ? 'selected' : ''}>📋 Pending</option>
                    <option value="approved" ${req.status === 'approved' ? 'selected' : ''}>✅ Approved</option>
                    <option value="rejected" ${req.status === 'rejected' ? 'selected' : ''}>❌ Rejected</option>
                  </select>
                </td>
                <td style="padding: 12px; text-align: center;">
                  <button onclick="deleteAppRequest(${req.id})" style="
                    background: rgba(220, 38, 38, 0.2);
                    color: #fca5a5;
                    border: 1px solid rgba(220, 38, 38, 0.4);
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 600;
                  ">Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

  } catch (error) {
    console.error('Error loading requests:', error);
  }
}

// Line 121: Update request status
async function updateRequestStatus(id, status) {
  try {
    if (!window.supabaseClient) return;

    const { error } = await window.supabaseClient
      .from('app_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    
    console.log('✅ Status updated to:', status);
    loadAppRequests(); // Reload list
  } catch (error) {
    console.error('Error:', error);
    alert('❌ Error: ' + error.message);
  }
}

// Line 141: Delete request
async function deleteAppRequest(id) {
  if (!confirm('Delete this request?')) return;

  try {
    if (!window.supabaseClient) return;

    const { error } = await window.supabaseClient
      .from('app_requests')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    alert('✅ Deleted');
    loadAppRequests();
  } catch (error) {
    console.error('Error:', error);
    alert('❌ Error: ' + error.message);
  }
}

// Line 161: Create requests section if missing
function createRequestsSection() {
  const adminSection = document.querySelector('.admin-section');
  if (!adminSection) return;

  const requestsSection = document.createElement('div');
  requestsSection.innerHTML = `
    <div class="section-head" style="margin-top: 40px;">
      <div>
        <div class="eyebrow">USER REQUESTS</div>
        <h2 class="section-title">App Requests</h2>
      </div>
    </div>
    <div id="app-requests-list"></div>
  `;

  adminSection.parentNode.insertBefore(requestsSection, adminSection.nextSibling);
  loadAppRequests();
}

// Line 183: Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdminPanel);
} else {
  initAdminPanel();
}
