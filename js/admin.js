/* ===================== ADMIN PANEL LOGIC ===================== */

let IS_EDITING = false;

document.addEventListener("DOMContentLoaded", async () => {
  const session = await requireAuth();
  if (!session) return;
  refreshNavAuth();

  const { data: profile } = await supabaseClient
    .from("profiles").select("is_admin").eq("id", session.user.id).single();

  const isAdmin = profile?.is_admin || ADMIN_EMAILS.includes(session.user.email);

  if (!isAdmin) {
    document.getElementById("admin-guard").innerHTML = `
      <div class="empty-state">
        <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <div>This page is for admins only.</div>
      </div>`;
    return;
  }

  document.getElementById("admin-guard").style.display = "none";
  document.getElementById("admin-content").style.display = "block";

  loadAdminApps();
  loadFlaggedReviews();
  loadImageGallery();
  loadAppRequests();

  let adminSearchTimer;
  document.getElementById("admin-search-input").addEventListener("input", (e) => {
    clearTimeout(adminSearchTimer);
    adminSearchTimer = setTimeout(() => {
      loadAdminApps(e.target.value.trim());
    }, 350);
  });

  document.getElementById("add-app-btn").addEventListener("click", () => openModal());
  document.getElementById("close-modal").addEventListener("click", closeModal);
  document.getElementById("app-modal").addEventListener("click", (e) => {
    if (e.target.id === "app-modal") closeModal();
  });
  document.getElementById("app-form").addEventListener("submit", saveApp);

  // Gallery events
  document.getElementById('new-image-btn').addEventListener('click', toggleImageForm);
});

// ============ APPS SECTION ============

async function loadAdminApps(searchQuery = "") {
  let query = supabaseClient.from("apps").select("*").order("created_at", { ascending: false });

  if (searchQuery) {
    const q = searchQuery.replace(/[%_]/g, "");
    query = query.ilike("name", `%${q}%`);
  } else {
    query = query.limit(100);
  }

  const { data: apps, error } = await query;

  const { data: ratings } = await supabaseClient.from("app_ratings").select("*");
  const ratingMap = {};
  (ratings || []).forEach(r => ratingMap[r.app_id] = r);

  const tbody = document.getElementById("admin-table-body");

  if (error || !apps?.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-faint);padding:30px">${searchQuery ? "No apps match that search." : "No apps added yet."}</td></tr>`;
    return;
  }

  tbody.innerHTML = apps.map(app => {
    const r = ratingMap[app.id];
    return `
    <tr>
      <td><img class="table-icon" src="${escapeHTML(app.icon_url || 'assets/placeholder-icon.svg')}" onerror="this.style.opacity=0"></td>
      <td>${escapeHTML(app.name)}</td>
      <td>${escapeHTML(app.category)}</td>
      <td>${r ? `★ ${r.avg_rating} (${r.review_count})` : "—"}</td>
      <td style="font-family:var(--f-mono);font-size:12px;color:var(--text-faint)">${new Date(app.created_at).toLocaleDateString("en-US")}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick='editApp(${JSON.stringify(app).replace(/'/g, "&apos;")})'>Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteApp('${app.id}')">Delete</button>
      </td>
    </tr>`;
  }).join("");
}

function openModal() {
  IS_EDITING = false;
  document.getElementById("modal-title").textContent = "Add New App";
  document.getElementById("app-form").reset();
  document.getElementById("app-id-field").value = "";
  document.getElementById("app-modal").classList.add("show");
}

function editApp(app) {
  IS_EDITING = true;
  document.getElementById("modal-title").textContent = "Edit App";
  document.getElementById("app-id-field").value = app.id;
  document.getElementById("f-name").value = app.name;
  document.getElementById("f-category").value = app.category;
  document.getElementById("f-description").value = app.description;
  document.getElementById("f-icon").value = app.icon_url || "";
  document.getElementById("f-size").value = app.app_size || "";
  document.getElementById("f-downloads").value = app.downloads || "";
  document.getElementById("f-screenshots").value = (app.screenshots || []).join(", ");
  document.getElementById("f-download").value = app.download_url || "";
  document.getElementById("f-note").value = app.developer_note || "";
  document.getElementById("app-modal").classList.add("show");
}

function closeModal() {
  document.getElementById("app-modal").classList.remove("show");
}

async function saveApp(e) {
  e.preventDefault();
  const btn = document.getElementById("save-app-btn");
  btn.disabled = true; btn.textContent = "Saving...";

  const payload = {
    name: document.getElementById("f-name").value.trim(),
    category: document.getElementById("f-category").value.trim(),
    description: document.getElementById("f-description").value.trim(),
    icon_url: document.getElementById("f-icon").value.trim() || null,
    app_size: document.getElementById("f-size").value.trim() || null,
    downloads: document.getElementById("f-downloads").value.trim() || null,
    screenshots: document.getElementById("f-screenshots").value
      .split(",").map(s => s.trim()).filter(Boolean),
    download_url: document.getElementById("f-download").value.trim() || null,
    developer_note: document.getElementById("f-note").value.trim() || null
  };

  const appId = document.getElementById("app-id-field").value;
  let error;

  if (appId) {
    ({ error } = await supabaseClient.from("apps").update(payload).eq("id", appId));
  } else {
    ({ error } = await supabaseClient.from("apps").insert(payload));
  }

  btn.disabled = false; btn.textContent = "Save";

  if (error) {
    showToast("Could not save: " + error.message, "error");
    console.error(error);
    return;
  }

  showToast(appId ? "App updated!" : "App added!", "success");
  closeModal();
  loadAdminApps();
}

// ============ FLAGGED REVIEWS ============

async function loadFlaggedReviews() {
  const wrap = document.getElementById("flagged-reviews-wrap");

  const { data: reviews, error } = await supabaseClient
    .from("reviews")
    .select("id, app_id, rating, comment, flag_reason, created_at, apps(name)")
    .eq("is_flagged", true)
    .order("created_at", { ascending: false });

  if (error) {
    wrap.innerHTML = `<div style="color:var(--danger);font-size:13.5px">Could not load flagged reviews: ${error.message}</div>`;
    return;
  }

  if (!reviews || !reviews.length) {
    wrap.innerHTML = `<div style="color:var(--text-faint);font-size:13.5px">No flagged reviews. All clear.</div>`;
    return;
  }

  wrap.innerHTML = reviews.map(r => `
    <div class="review-item">
      <div class="review-head">
        <div>
          <div class="review-name">${escapeHTML(r.apps?.name || "Unknown app")} — ${r.rating}★</div>
          <div class="review-date">Flagged for: ${escapeHTML(r.flag_reason || "unknown")} · ${timeAgo(r.created_at)}</div>
        </div>
      </div>
      ${r.comment ? `<div class="review-comment">${escapeHTML(r.comment)}</div>` : "<div style='color:var(--text-faint);font-size:13px'>(no comment)</div>"}
      <div style="display:flex;gap:10px;margin-top:12px">
        <button class="btn btn-primary btn-sm" onclick="approveReview('${r.id}')">Approve</button>
        <button class="btn btn-danger btn-sm" onclick="rejectReview('${r.id}')">Delete</button>
      </div>
    </div>
  `).join("");
}

// ============ APP REQUESTS - FIXED ============

async function loadAppRequests() {
  try {
    console.log('📝 Loading app requests...');

    const wrap = document.getElementById("admin-requests-wrap");
    if (!wrap) return;

    const { data: requests, error } = await supabaseClient
      .from('app_requests')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('Requests query:', { count: requests?.length, error });

    if (error) {
      console.error('❌ Load requests error:', error);
      wrap.innerHTML = `<div style="color: red; font-size: 12px; padding: 20px;">Error loading: ${error.message}</div>`;
      return;
    }

    if (!requests || requests.length === 0) {
      wrap.innerHTML = '<div style="text-align: center; color: var(--text-faint); padding: 20px;">No app requests</div>';
      return;
    }

    wrap.innerHTML = `
      <table class="admin-table" style="width: 100%; font-size: 13px;">
        <thead>
          <tr>
            <th>App Name</th>
            <th>Reason</th>
            <th>Date</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${requests.map(r => `
            <tr>
              <td style="font-weight: 600;">${escapeHTML(r.app_name)}</td>
              <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; font-size: 11px;">${escapeHTML((r.reason || 'N/A').substring(0, 50))}</td>
              <td>${new Date(r.created_at).toLocaleDateString()}</td>
              <td>
                <select onchange="updateRequestStatus(${r.id}, this.value)" style="
                  background: var(--void);
                  color: var(--text);
                  border: 1px solid var(--line);
                  padding: 4px 8px;
                  border-radius: 4px;
                  font-size: 11px;
                  cursor: pointer;
                ">
                  <option value="pending" ${r.status === 'pending' ? 'selected' : ''}>Pending</option>
                  <option value="approved" ${r.status === 'approved' ? 'selected' : ''}>Approved</option>
                  <option value="rejected" ${r.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                </select>
              </td>
              <td>
                <button onclick="deleteRequest(${r.id})" class="btn btn-danger btn-sm" style="padding: 4px 8px; font-size: 11px;">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    console.log('✅ Requests loaded:', requests.length);

  } catch (error) {
    console.error('❌ Requests error:', error);
  }
}

async function updateRequestStatus(id, status) {
  try {
    console.log('🔄 Updating request', id, 'to', status);

    const { error } = await supabaseClient
      .from('app_requests')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('❌ Update error:', error);
      showToast('❌ Error: ' + error.message, 'error');
      return;
    }

    console.log('✅ Status updated');
    showToast('✅ Status updated', 'success');
    loadAppRequests();
  } catch (error) {
    console.error('❌ Catch error:', error);
  }
}

async function deleteRequest(id) {
  if (!confirm('Delete this request?')) return;

  try {
    console.log('🗑️ Deleting request ID:', id);

    const { error } = await supabaseClient
      .from('app_requests')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Delete error:', error);
      showToast('❌ Error: ' + error.message, 'error');
      return;
    }

    console.log('✅ Request deleted');
    showToast('✅ Request deleted', 'success');
    
    // Reload immediately
    await loadAppRequests();
  } catch (error) {
    console.error('❌ Catch error:', error);
    showToast('❌ Error: ' + error.message, 'error');
  }
}

// ============ IMAGE GALLERY - FIXED ============

async function loadImageGallery() {
  try {
    console.log('📷 Loading image gallery...');

    const wrap = document.getElementById("admin-gallery-wrap");
    if (!wrap) return;

    // Initialize form if not present
    if (!document.getElementById('image-form')) {
      wrap.innerHTML = `
        <button id="new-image-btn" class="btn btn-primary" style="margin-bottom: 15px;">📷 Upload Image</button>

        <div id="image-form" style="display:none; background: var(--line); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-bottom: 16px; font-size: 16px;">📷 Post Image</h3>
          
          <div class="admin-form-group">
            <label>Image URL *</label>
            <input type="url" id="image-url-input" placeholder="https://..." required>
          </div>
          
          <div class="admin-form-group">
            <label>Image Title (Optional)</label>
            <input type="text" id="image-title-input" placeholder="What's this image about?">
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-primary" onclick="saveImage()">Save Image</button>
            <button type="button" class="btn-secondary" onclick="toggleImageForm()">Cancel</button>
          </div>
        </div>

        <div id="gallery-list"></div>
      `;

      document.getElementById('new-image-btn').addEventListener('click', toggleImageForm);
    }

    // Load images
    const { data: images, error } = await supabaseClient
      .from('admin_images')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('Images query:', { count: images?.length, error });

    if (error) {
      console.error('❌ Load images error:', error);
      document.getElementById('gallery-list').innerHTML = `<div style="color: red;">Error: ${error.message}</div>`;
      return;
    }

    const list = document.getElementById('gallery-list');
    if (!list) return;

    if (!images || images.length === 0) {
      list.innerHTML = '<div style="text-align: center; color: var(--text-faint); padding: 15px;">No images yet</div>';
      return;
    }

    list.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px; margin-top: 16px;">
        ${images.map(img => `
          <div style="
            background: var(--void);
            border: 1px solid var(--line);
            border-radius: 8px;
            overflow: hidden;
            position: relative;
            height: 120px;
          ">
            <img src="${escapeHTML(img.image_url)}" alt="gallery" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'">
            <div style="
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              background: rgba(0,0,0,0.7);
              padding: 6px;
              text-align: center;
            ">
              <button onclick="deleteImage(${img.id})" class="btn btn-danger btn-sm" style="padding: 3px 6px; font-size: 10px; width: 100%;">Delete</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    console.log('✅ Images loaded:', images.length);

  } catch (error) {
    console.error('❌ Gallery error:', error);
  }
}

function toggleImageForm() {
  const form = document.getElementById('image-form');
  if (form) {
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
  }
}

async function saveImage() {
  const imageUrl = document.getElementById('image-url-input')?.value.trim();
  const title = document.getElementById('image-title-input')?.value.trim();
  
  if (!imageUrl) {
    showToast('❌ Image URL required', 'error');
    return;
  }
  
  try {
    console.log('📤 Saving image:', imageUrl);

    const { error } = await supabaseClient
      .from('admin_images')
      .insert({
        image_url: imageUrl,
        title: title || null,
        created_at: new Date().toISOString()
      });
    
    if (error) throw error;
    
    console.log('✅ Image saved');
    showToast('✅ Image saved', 'success');
    
    // Clear form
    document.getElementById('image-url-input').value = '';
    document.getElementById('image-title-input').value = '';
    document.getElementById('image-form').style.display = 'none';
    
    await loadImageGallery();
  } catch (error) {
    console.error('❌ Save error:', error);
    showToast('❌ Error: ' + error.message, 'error');
  }
}

async function deleteImage(id) {
  if (!confirm('Delete this image?')) return;
  
  try {
    console.log('🗑️ Deleting image ID:', id);

    const { error } = await supabaseClient
      .from('admin_images')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Delete error:', error);
      showToast('❌ Error: ' + error.message, 'error');
      return;
    }

    console.log('✅ Image deleted');
    showToast('✅ Image deleted', 'success');
    
    // Reload immediately
    await loadImageGallery();
  } catch (error) {
    console.error('❌ Catch error:', error);
    showToast('❌ Error: ' + error.message, 'error');
  }
}

function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
// ============ HELPER ============

function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
