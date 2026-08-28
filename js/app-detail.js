/* ===================== APP DETAIL PAGE LOGIC ===================== */

let CURRENT_APP_ID = null;
let CURRENT_SESSION = null;
let SELECTED_RATING = 0;
let CURRENT_APP = null;

document.addEventListener("DOMContentLoaded", async () => {
  refreshNavAuth();
  const { data: { session } } = await supabaseClient.auth.getSession();
  CURRENT_SESSION = session;

  CURRENT_APP_ID = qs("id");
  if (!CURRENT_APP_ID) {
    document.getElementById("detail-wrap").innerHTML = `<div class="empty-state">App not found.</div>`;
    return;
  }

  await loadAppDetail();

  // Listen for language changes
  window.addEventListener('languageChanged', () => {
    translateAppContent();
  });
});

async function loadAppDetail() {
  try {
    const { data: app, error } = await supabaseClient
      .from("apps").select("*").eq("id", CURRENT_APP_ID).single();

    if (error || !app) {
      document.getElementById("detail-wrap").innerHTML =
        `<div class="empty-state">This app could not be found.${error ? `<br><span style="font-size:11px;opacity:0.6">${escapeHTML(error.message)}</span>` : ""}</div>`;
      return;
    }

    CURRENT_APP = app;
    document.getElementById("page-title").textContent = app.name + " — MRZN Apps & Games";

    const { data: ratingRow, error: ratingErr } = await supabaseClient
      .from("app_ratings").select("*").eq("app_id", CURRENT_APP_ID).maybeSingle();
    if (ratingErr) console.error("rating error:", ratingErr);

    injectStructuredData(app, ratingRow);

    const { data: reviews, error: reviewsErr } = await supabaseClient
      .from("reviews_with_user").select("*").eq("app_id", CURRENT_APP_ID);
    if (reviewsErr) console.error("reviews error:", reviewsErr);

    renderDetail(app, ratingRow, reviews || []);
    bindReviewForm(app);
    trackRecentlyViewed(app);

    // Translate after rendering
    await translateAppContent();

  } catch (err) {
    document.getElementById("detail-wrap").innerHTML =
      `<div class="empty-state">Something went wrong: ${escapeHTML(err.message)}</div>`;
    console.error(err);
  }
}

function renderDetail(app, ratingRow, reviews) {
  const avg = ratingRow?.avg_rating || 0;
  const count = ratingRow?.review_count || 0;
  const icon = app.icon_url || "assets/placeholder-icon.svg";

  const myReview = CURRENT_SESSION ? reviews.find(r => r.user_id === CURRENT_SESSION.user.id) : null;

  const breakdown = [5, 4, 3, 2, 1].map(star => {
    const n = ratingRow ? (ratingRow["r" + star] || 0) : 0;
    const pct = count ? Math.round((n / count) * 100) : 0;
    return `<div class="rbar-row"><span>${star}★</span><div class="rbar-track"><div class="rbar-fill" style="width:${pct}%"></div></div><span>${n}</span></div>`;
  }).join("");

  const screenshots = (app.screenshots || []).length
    ? `<div class="screenshot-row">${app.screenshots.map(s => `<img src="${escapeHTML(s)}" alt="screenshot">`).join("")}</div>`
    : "";

  document.getElementById("detail-wrap").innerHTML = `
    <div class="detail-top">
      <img class="detail-icon" src="${escapeHTML(icon)}" alt="${escapeHTML(app.name)}" onerror="this.style.opacity=0">
      <div style="flex:1;min-width:220px">
        <div class="detail-title">${escapeHTML(app.name)}</div>
        <div class="detail-cat">${escapeHTML(app.category)}</div>
        <div class="detail-rating">
          <span class="avg">${avg || "—"}</span>
          ${starsHTML(avg, 18)}
          <span class="rating-count">(${count} reviews)</span>
        </div>
        <div style="display:flex;gap:16px;margin-top:10px;font-family:var(--f-mono);font-size:12px;color:var(--text-faint)">
          ${app.app_size ? `<span>📦 ${escapeHTML(app.app_size)}</span>` : ""}
          ${app.downloads ? `<span>⬇ ${escapeHTML(app.downloads)} downloads</span>` : ""}
        </div>
      </div>
      ${app.download_url ? `<a href="${escapeHTML(app.download_url)}" target="_blank" rel="noopener" class="btn btn-primary">Download</a>` : ""}
      <button class="btn btn-ghost" id="favorite-btn" data-app-id="${app.id}" data-app-name="${escapeHTML(app.name)}" data-app-icon="${escapeHTML(app.icon_url || '')}">${isFavorited(app.id) ? "❤️ Favorited" : "🤍 Favorite"}</button>
    </div>

    ${screenshots}

    <div class="panel">
      <div class="field-label" style="font-size:12px;margin-bottom:10px">About</div>
      <p id="app-about-text" style="color:var(--text-dim);font-size:14.5px;line-height:1.8">${escapeHTML(app.description)}</p>
      ${app.developer_note ? `<p style="color:var(--cyan);font-size:13.5px;margin-top:14px"><strong>Developer note:</strong> <span id="app-dev-note">${escapeHTML(app.developer_note)}</span></p>` : ""}
    </div>

    <div class="panel" style="margin-top:20px">
      <div style="display:flex;gap:30px;flex-wrap:wrap">
        <div style="flex:1;min-width:200px">
          <div class="field-label" style="font-size:12px;margin-bottom:12px">Rating Breakdown</div>
          ${count ? breakdown : `<div style="color:var(--text-faint);font-size:13px">No reviews yet.</div>`}
        </div>
        <div style="flex:1;min-width:260px" id="review-form-wrap"></div>
      </div>
    </div>

    <div class="panel" style="margin-top:20px">
      <div class="field-label" style="font-size:12px;margin-bottom:14px">All Reviews (${reviews.length})</div>
      <div id="review-list">
        ${reviews.length ? reviews.map(reviewItemHTML).join("") : `<div style="color:var(--text-faint);font-size:13.5px">Be the first to leave a review.</div>`}
      </div>
    </div>
  `;

  renderReviewForm(myReview);

  document.getElementById("favorite-btn")?.addEventListener("click", (e) => {
    const btn = e.currentTarget;
    const isNowFav = toggleFavorite(btn.dataset.appId, btn.dataset.appName, btn.dataset.appIcon);
    btn.textContent = isNowFav ? "❤️ Favorited" : "🤍 Favorite";
    showToast(isNowFav ? "Added to favorites!" : "Removed from favorites.", "success");
  });
}

// ============ TRANSLATION - ONLY FOR ABOUT SECTION ============

async function translateAppContent() {
  try {
    if (!window.languageManager) {
      console.warn('Language manager not ready');
      return;
    }

    const currentLang = window.languageManager.currentLang;
    if (currentLang === 'en' || !CURRENT_APP) return;

    console.log('🌐 Translating About section to:', currentLang);

    // Translate description
    const aboutElement = document.getElementById('app-about-text');
    if (aboutElement && CURRENT_APP.description) {
      try {
        const translated = await translateLongText(CURRENT_APP.description, currentLang);
        
        if (translated && translated !== CURRENT_APP.description) {
          aboutElement.textContent = translated;
          console.log('✅ Description translated');
        }
      } catch (error) {
        console.warn('Description translation error:', error);
        // Keep original if translation fails
        aboutElement.textContent = CURRENT_APP.description;
      }
    }

    // Translate developer note
    const devNoteElement = document.getElementById('app-dev-note');
    if (devNoteElement && CURRENT_APP.developer_note) {
      try {
        const translated = await translateLongText(CURRENT_APP.developer_note, currentLang);
        
        if (translated && translated !== CURRENT_APP.developer_note) {
          devNoteElement.textContent = translated;
          console.log('✅ Developer note translated');
        }
      } catch (error) {
        console.warn('Developer note translation error:', error);
        // Keep original if translation fails
        devNoteElement.textContent = CURRENT_APP.developer_note;
      }
    }

  } catch (error) {
    console.error('Translation error:', error);
  }
}

// Helper function to translate text longer than 500 chars
async function translateLongText(text, targetLang) {
  if (!text || text.length < 2) return text;

  // If text is short enough, translate directly
  if (text.length <= 450) {
    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`
      );
      const data = await response.json();
      return data.responseData?.translatedText || text;
    } catch (error) {
      console.warn('Translation API error:', error);
      return text;
    }
  }

  // If text is too long, split into sentences and translate each
  console.log('📝 Text too long (' + text.length + ' chars), splitting into chunks...');
  
  const sentences = text.match(/[^\.!\?\n]+[\.!\?\n]+/g) || [text];
  let translated = '';

  for (let sentence of sentences) {
    const trimmed = sentence.trim();
    
    if (trimmed.length < 2) {
      translated += sentence;
      continue;
    }

    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=en|${targetLang}`
      );
      const data = await response.json();
      const result = data.responseData?.translatedText || trimmed;
      translated += result + ' ';
    } catch (error) {
      console.warn('Chunk translation error, keeping original');
      translated += trimmed + ' ';
    }
  }

  return translated.trim();
}

// ============ REST OF FUNCTIONS ============

function isFavorited(appId) {
  const favs = JSON.parse(localStorage.getItem("mrzn_favorites") || "[]");
  return favs.some(f => f.id === appId);
}

function toggleFavorite(appId, appName, appIcon) {
  let favs = JSON.parse(localStorage.getItem("mrzn_favorites") || "[]");
  const exists = favs.some(f => f.id === appId);
  if (exists) {
    favs = favs.filter(f => f.id !== appId);
  } else {
    favs.unshift({ id: appId, name: appName, icon: appIcon });
  }
  localStorage.setItem("mrzn_favorites", JSON.stringify(favs));
  return !exists;
}

function trackRecentlyViewed(app) {
  try {
    let recent = JSON.parse(localStorage.getItem("mrzn_recently_viewed") || "[]");
    recent = recent.filter(a => a.id !== app.id);
    recent.unshift({ id: app.id, name: app.name, icon: app.icon_url });
    recent = recent.slice(0, 20);
    localStorage.setItem("mrzn_recently_viewed", JSON.stringify(recent));
  } catch (e) { /* ignore */ }
}

function injectStructuredData(app, ratingRow) {
  document.getElementById("structured-data")?.remove();

  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": app.name,
    "description": app.description,
    "applicationCategory": app.category,
    "operatingSystem": "Android",
  };

  if (app.icon_url) data.image = app.icon_url;
  if (app.download_url) data.url = app.download_url;

  if (ratingRow && ratingRow.review_count > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": ratingRow.avg_rating,
      "reviewCount": ratingRow.review_count,
      "bestRating": "5",
      "worstRating": "1",
    };
  }

  const script = document.createElement("script");
  script.id = "structured-data";
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);

  setMetaTag("og:title", app.name);
  setMetaTag("og:description", app.description);
  if (app.icon_url) setMetaTag("og:image", app.icon_url);
  setMetaTag("og:type", "website");
}

function setMetaTag(property, content) {
  let tag = document.querySelector(`meta[property="${property}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("property", property);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function reviewItemHTML(r) {
  return `
  <div class="review-item">
    <div class="review-head">
      <div class="review-user">
        <div class="avatar-sm">${initials(r.username)}</div>
        <div>
          <div class="review-name">${escapeHTML(r.username)}</div>
          <div class="review-date">${timeAgo(r.created_at)}</div>
        </div>
      </div>
      ${starsHTML(r.rating, 14)}
    </div>
    ${r.comment ? `<div class="review-comment">${escapeHTML(r.comment)}</div>` : ""}
  </div>`;
}

function renderReviewForm(myReview) {
  const wrap = document.getElementById("review-form-wrap");
  if (!CURRENT_SESSION) {
    wrap.innerHTML = `
      <div class="field-label" style="font-size:12px;margin-bottom:12px">Leave a Review</div>
      <div style="color:var(--text-faint);font-size:13.5px"><a href="login.html" style="color:var(--cyan);text-decoration:underline">Log in</a> to leave a review.</div>
    `;
    return;
  }

  SELECTED_RATING = myReview?.rating || 0;

  wrap.innerHTML = `
    <div class="field-label" style="font-size:12px;margin-bottom:12px">${myReview ? "Edit Your Review" : "Leave a Review"}</div>
    <div class="star-input" id="star-input" style="margin-bottom:12px"></div>
    <textarea class="field" id="review-comment" placeholder="Share your experience (optional)">${myReview ? escapeHTML(myReview.comment || "") : ""}</textarea>
    <div style="display:flex;gap:10px;margin-top:12px">
      <button class="btn btn-primary btn-sm" id="submit-review-btn">${myReview ? "Update" : "Submit"}</button>
      ${myReview ? `<button class="btn btn-danger btn-sm" id="delete-review-btn">Delete</button>` : ""}
    </div>
  `;

  buildStarInput();

  document.getElementById("submit-review-btn").addEventListener("click", () => submitReview());
  document.getElementById("delete-review-btn")?.addEventListener("click", () => deleteReview());
}

function buildStarInput() {
  const el = document.getElementById("star-input");
  el.innerHTML = "";
  for (let i = 1; i <= 5; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "★";
    btn.className = i <= SELECTED_RATING ? "filled" : "";
    btn.addEventListener("click", () => {
      SELECTED_RATING = i;
      buildStarInput();
    });
    el.appendChild(btn);
  }
}

function bindReviewForm() {
  // handled inline in renderReviewForm after each render
}

async function submitReview() {
  if (!SELECTED_RATING) {
    showToast("Please select a rating", "error");
    return;
  }
  const comment = document.getElementById("review-comment").value.trim();
  const btn = document.getElementById("submit-review-btn");
  btn.disabled = true; btn.textContent = "Submitting...";

  const modResult = moderateReview(comment);

  const { error } = await supabaseClient.from("reviews").upsert({
    app_id: CURRENT_APP_ID,
    user_id: CURRENT_SESSION.user.id,
    rating: SELECTED_RATING,
    comment: comment || null,
    is_flagged: modResult.flagged,
    flag_reason: modResult.reason
  }, { onConflict: "app_id,user_id" });

  if (error) {
    showToast("Could not submit review.", "error");
    console.error(error);
    btn.disabled = false; btn.textContent = "Submit";
    return;
  }

  if (modResult.flagged) {
    showToast("Review submitted — pending approval before it shows publicly.", "info");
  } else {
    showToast("Review submitted!", "success");
  }
  await loadAppDetail();
}

async function deleteReview() {
  if (!confirm("Delete this review?")) return;
  const { error } = await supabaseClient
    .from("reviews").delete()
    .eq("app_id", CURRENT_APP_ID).eq("user_id", CURRENT_SESSION.user.id);

  if (error) {
    showToast("Could not delete.", "error");
    return;
  }
  showToast("Review deleted.", "success");
  await loadAppDetail();
}

function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
