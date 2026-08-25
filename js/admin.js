/**
 * 🛠️ Admin Panel - Complete
 * App Management + Updates Management + App Requests
 */

document.addEventListener("DOMContentLoaded", () => {
  console.log('🛠️ Loading admin panel...');
  
  refreshNavAuth();
  checkAdminAccess();
  
  // Initialize all admin functions
  loadAppsList();
  loadAdminUpdates();
  loadAppRequests();
});

// ============ CHECK ADMIN ACCESS ============

async function checkAdminAccess() {
  try {
    if (!window.supabaseClient) {
      console.warn('Database not ready');
      return;
    }

    const { data: { session } } = await window.supabaseClient.auth.getSession();
    
    if (!session) {
      window.location.href = 'login.html';
      return;
    }

    const { data: profile } = await window.supabaseClient
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single();

    if (!profile?.is_admin) {
      document.body.innerHTML = '<div style="padding: 40px; text-align: center; color: red;">❌ Admin access required</div>';
      setTimeout(() => window.location.href = 'index.html', 2000);
    }
  } catch (error) {
    console.error('Admin check error:', error);
  }
}

// ============ APPS MANAGEMENT ============

async function loadAppsList() {
  try {
    console.log('📱 Loading apps list...');

    if (!window.supabaseClient) {
      console.warn('Database not ready');
      return;
    }

    const { data: apps, error } = await window.supabaseClient
      .from('apps')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Load error:', error);
      return;
    }

    const container = document.querySelector('[id*="app"]') || 
                     document.querySelector('table') ||
                     document.body;

    if (!container) {
      console.warn('Container not found');
      return;
    }

    // Create apps section if needed
    let appsSection = document.getElementById('admin-apps-section');
    if (!appsSection) {
      appsSection = document.createElement('div');
      appsSection.id = 'admin-apps-section';
      appsSection.style.marginBottom = '40px';
      container.insertBefore(appsSection, container.firstChild);
    }

    if (!apps || apps.length === 0) {
      appsSection.innerHTML = '<div style="text-align: center; color: var(--text-faint); padding: 20px;">No apps yet</div>';
      return;
    }

    // Build table
    appsSection.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h2 style="margin-bottom: 15px;">📱 All Apps (${apps.length})</h2>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid var(--line);">
                <th style="padding: 12px; text-align: left; font-weight: 600;">App Name</th>
                <th style="padding: 12px; text-align: left; font-weight: 600;">Category</th>
                <th style="padding: 12px; text-align: left; font-weight: 600;">Rating</th>
                <th style="padding: 12px; text-align: left; font-weight: 600;">Reviews</th>
                <th style="padding: 12px; text-align: center; font-weight: 600;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${apps.map(app => `
                <tr style="border-bottom: 1px solid var(--line);">
                  <td style="padding: 12px; font-weight: 600;">${escapeHTML(app.name || 'N/A')}</td>
                  <td style="padding: 12px;">${escapeHTML(app.category || 'N/A')}</td>
                  <td style="padding: 12px;">⭐ ${(app.rating || 0).toFixed(1)}</td>
                  <td style="padding: 12px;">👥 ${app.review_count || 0}</td>
                  <td style="padding: 12px; text-align: center;">
                    <button onclick="editApp(${app.id})" style="
                      background: var(--cyan);
                      color: var(--void);
                      border: none;
                      padding: 6px 12px;
                      border-radius: 4px;
                      cursor: pointer;
                      font-weight: 600;
                      margin-right: 4px;
                    ">Edit</button>
                    <button onclick="deleteApp(${app.id})" style="
                      background: rgba(220, 38, 38, 0.2);
                      color: #fca5a5;
                      border: 1px solid rgba(220, 38, 38, 0.4);
                      padding: 6px 12px;
                      border-radius: 4px;
                      cursor: pointer;
                      font-weight: 600;
                    ">Delete</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    console.log('✅ Apps list loaded');

  } catch (error) {
    console.error('Apps list error:', error);
  }
}

async function editApp(id) {
  console.log('Edit app:', id);
  alert('Edit functionality coming soon');
}

async function deleteApp(id) {
  if (!confirm('Delete this app?')) return;

  try {
    if (!window.supabaseClient) return;

    const { error } = await window.supabaseClient
      .from('apps')
      .delete()
      .eq('id', id);

    if (error) throw error;

    alert('✅ App deleted');
    loadAppsList();
  } catch (error) {
    console.error('Delete error:', error);
    alert('❌ Error: ' + error.message);
  }
}

// ============ UPDATES MANAGEMENT ============

async function loadAdminUpdates() {
  try {
    console.log('📰 Loading updates...');

    if (!window.supabaseClient) {
      console.warn('Database not ready');
      return;
    }

    // Create updates section
    let updatesSection = document.getElementById('admin-updates-section');
    if (!updatesSection) {
      updatesSection = document.createElement('div');
      updatesSection.id = 'admin-updates-section';
      updatesSection.style.marginBottom = '40px';
      document.body.appendChild(updatesSection);
    }

    updatesSection.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h2 style="margin-bottom: 15px;">📰 Website Updates</h2>
        
        <button id="new-update-btn" style="
          background: var(--cyan);
          color: var(--void);
          padding: 10px 20px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-weight: 700;
          margin-bottom: 15px;
        ">+ New Update</button>

        <!-- Update Form (Hidden by default) -->
        <div id="update-form" style="display:none; background: var(--line); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-bottom: 15px; font-size: 16px;">📸 Post Update</h3>
          
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px;">Title *</label>
            <input type="text" id="update-title" placeholder="e.g., New Features Available 🎉" style="
              width: 100%;
              padding: 10px;
              border: 1px solid var(--line);
              border-radius: 6px;
              background: var(--void);
              color: var(--text);
              font-size: 14px;
              box-sizing: border-box;
            ">
          </div>
          
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px;">Description *</label>
            <textarea id="update-description" placeholder="What's new? What changed?" style="
              width: 100%;
              padding: 10px;
              border: 1px solid var(--line);
              border-radius: 6px;
              background: var(--void);
              color: var(--text);
              font-size: 14px;
              box-sizing: border-box;
              min-height: 100px;
            "></textarea>
          </div>

          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px;">Image URL</label>
            <input type="url" id="update-image-url" placeholder="Paste image URL from Supabase Storage" style="
              width: 100%;
              padding: 10px;
              border: 1px solid var(--line);
              border-radius: 6px;
              background: var(--void);
              color: var(--text);
              font-size: 14px;
              box-sizing: border-box;
            ">
            <small style="color: var(--text-faint); display: block; margin-top: 4px;">📁 Upload image to Supabase Storage first, then paste the URL</small>
          </div>

          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px;">Version (Optional)</label>
            <input type="text" id="update-version" placeholder="v2.1.0" style="
              width: 100%;
              padding: 10px;
              border: 1px solid var(--line);
              border-radius: 6px;
              background: var(--void);
              color: var(--text);
              font-size: 14px;
              box-sizing: border-box;
            ">
          </div>
          
          <div style="display: flex; gap: 10px;">
            <button onclick="saveUpdate()" style="
              background: var(--cyan);
              color: var(--void);
              padding: 10px 20px;
              border-radius: 6px;
              border: none;
              cursor: pointer;
              font-weight: 700;
            ">Publish Update</button>
            <button onclick="toggleUpdateForm()" style="
              background: var(--line);
              color: var(--text);
              padding: 10px 20px;
              border-radius: 6px;
              border: 1px solid var(--line);
              cursor: pointer;
              font-weight: 700;
            ">Cancel</button>
          </div>
        </div>

        <!-- Updates List -->
        <div id="updates-list"></div>
      </div>
    `;

    // Add event listeners
    document.getElementById('new-update-btn').addEventListener('click', toggleUpdateForm);

    // Load updates
    const { data: updates, error } = await window.supabaseClient
      .from('website_updates')
      .select('*')
      .order('published_date', { ascending: false });

    if (error) throw error;

    const list = document.getElementById('updates-list');

    if (!updates || updates.length === 0) {
      list.innerHTML = '<div style="text-align: center; color: var(--text-faint); padding: 20px;">No updates yet</div>';
      return;
    }

    list.innerHTML = updates.map(update => `
      <div style="
        background: rgba(0, 229, 255, 0.05);
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 12px;
      ">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div style="flex: 1;">
            <div style="font-weight: 700; color: var(--cyan); margin-bottom: 4px;">${escapeHTML(update.title)}</div>
            <div style="font-size: 13px; color: var(--text-dim); margin-bottom: 8px;">${update.description?.substring(0, 80)}</div>
            <div style="font-size: 11px; color: var(--text-faint);">
              📅 ${new Date(update.published_date).toLocaleDateString()}
              ${update.version ? ' • v' + update.version : ''}
            </div>
          </div>
          <button onclick="deleteUpdate(${update.id})" style="
            background: rgba(220, 38, 38, 0.2);
            color: #fca5a5;
            border: 1px solid rgba(220, 38, 38, 0.4);
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
          ">Delete</button>
        </div>
      </div>
    `).join('');

    console.log('✅ Updates loaded');

  } catch (error) {
    console.error('Updates error:', error);
  }
}

function toggleUpdateForm() {
  const form = document.getElementById('update-form');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
  if (form.style.display === 'block') {
    document.getElementById('update-title').focus();
  }
}

async function saveUpdate() {
  const title = document.getElementById('update-title').value.trim();
  const description = document.getElementById('update-description').value.trim();
  const imageUrl = document.getElementById('update-image-url').value.trim();
  const version = document.getElementById('update-version').value.trim();
  
  if (!title || !description) {
    alert('❌ Title and description are required');
    return;
  }
  
  try {
    if (!window.supabaseClient) {
      alert('❌ Database not connected');
      return;
    }

    const { error } = await window.supabaseClient
      .from('website_updates')
      .insert({
        title,
        description,
        image_url: imageUrl || null,
        version: version || null,
        status: 'published',
        published_date: new Date().toISOString()
      });
    
    if (error) throw error;
    
    alert('✅ Update published!');
    
    // Clear form
    document.getElementById('update-title').value = '';
    document.getElementById('update-description').value = '';
    document.getElementById('update-image-url').value = '';
    document.getElementById('update-version').value = '';
    document.getElementById('update-form').style.display = 'none';
    
    loadAdminUpdates();
  } catch (error) {
    console.error('Error:', error);
    alert('❌ Error: ' + error.message);
  }
}

async function deleteUpdate(id) {
  if (!confirm('Delete this update?')) return;
  
  try {
    if (!window.supabaseClient) return;

    const { error } = await window.supabaseClient
      .from('website_updates')
      .delete()
      .eq('id', id);

    if (error) throw error;

    alert('✅ Deleted');
    loadAdminUpdates();
  } catch (error) {
    console.error('Error:', error);
    alert('❌ Error: ' + error.message);
  }
}

// ============ APP REQUESTS ============

async function loadAppRequests() {
  try {
    console.log('📝 Loading app requests...');

    if (!window.supabaseClient) {
      console.warn('Database not ready');
      return;
    }

    // Create requests section
    let requestsSection = document.getElementById('admin-requests-section');
    if (!requestsSection) {
      requestsSection = document.createElement('div');
      requestsSection.id = 'admin-requests-section';
      document.body.appendChild(requestsSection);
    }

    const { data: requests, error } = await window.supabaseClient
      .from('app_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    if (!requests || requests.length === 0) {
      requestsSection.innerHTML = '<div style="text-align: center; color: var(--text-faint); padding: 40px 20px;">No app requests yet</div>';
      return;
    }

    requestsSection.innerHTML = `
      <div style="margin-top: 40px;">
        <h2 style="margin-bottom: 15px;">📝 App Requests (${requests.length})</h2>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse;">
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
                <tr style="border-bottom: 1px solid var(--line);">
                  <td style="padding: 12px; font-weight: 600;">${escapeHTML(req.app_name || 'N/A')}</td>
                  <td style="padding: 12px;">
                    <a href="${req.app_link}" target="_blank" rel="noopener" style="color: var(--cyan); text-decoration: none; word-break: break-all;">
                      ${req.app_link?.substring(0, 40) || 'N/A'}...
                    </a>
                  </td>
                  <td style="padding: 12px; max-width: 200px; overflow: hidden; text-overflow: ellipsis;">
                    ${req.reason ? escapeHTML(req.reason.substring(0, 50)) : 'N/A'}
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
      </div>
    `;

    console.log('✅ App requests loaded');

  } catch (error) {
    console.error('Requests error:', error);
  }
}

async function updateRequestStatus(id, status) {
  try {
    if (!window.supabaseClient) return;

    const { error } = await window.supabaseClient
      .from('app_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    console.log('✅ Status updated');
    loadAppRequests();
  } catch (error) {
    console.error('Error:', error);
    alert('❌ Error: ' + error.message);
  }
}

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

// ============ HELPER FUNCTIONS ============

function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
