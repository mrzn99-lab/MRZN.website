/* ===================================================================
   MRZN APP REQUEST — shared modal, usable from any page
   Call window.openAppRequestModal("optional prefilled name") to open it.
   =================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.id = "app-request-overlay";
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-head">
        <div class="modal-title">Request an App</div>
        <button class="close-x" id="app-request-close">✕</button>
      </div>
      <p style="color:var(--text-dim);font-size:13.5px;margin-bottom:16px">Can't find an app you're looking for? Let us know and we'll try to add it.</p>
      <form id="app-request-form">
        <div class="field-group">
          <label class="field-label">App Name *</label>
          <input type="text" class="field" id="req-name" required placeholder="e.g. Notion">
        </div>
        <div class="field-group">
          <label class="field-label">Any extra details (optional)</label>
          <textarea class="field" id="req-note" placeholder="Play Store link, category, etc."></textarea>
        </div>
        <button type="submit" class="btn btn-primary btn-block" id="req-submit-btn">Submit Request</button>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);

  const closeBtn = document.getElementById("app-request-close");
  closeBtn.addEventListener("click", () => overlay.classList.remove("show"));
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.classList.remove("show"); });

  document.getElementById("app-request-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("req-submit-btn");
    btn.disabled = true; btn.textContent = "Submitting...";

    const { data: { session } } = await supabaseClient.auth.getSession();

    const { error } = await supabaseClient.from("app_requests").insert({
      requested_name: document.getElementById("req-name").value.trim(),
      note: document.getElementById("req-note").value.trim() || null,
      user_id: session?.user?.id || null,
    });

    btn.disabled = false; btn.textContent = "Submit Request";

    if (error) {
      showToast("Could not submit request.", "error");
      console.error(error);
      return;
    }

    showToast("Request submitted — thank you!", "success");
    document.getElementById("app-request-form").reset();
    overlay.classList.remove("show");
  });

  window.openAppRequestModal = function (prefillName) {
    if (prefillName) document.getElementById("req-name").value = prefillName;
    overlay.classList.add("show");
  };
});
      
