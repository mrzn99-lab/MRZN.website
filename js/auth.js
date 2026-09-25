/* ===================== AUTH PAGE LOGIC ===================== */

document.addEventListener("DOMContentLoaded", async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    window.location.href = "index.html";
    return;
  }
  refreshNavAuth();

  const tabLogin = document.getElementById("tab-login");
  const tabRegister = document.getElementById("tab-register");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  tabLogin.addEventListener("click", () => {
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
    loginForm.style.display = "block";
    registerForm.style.display = "none";
    hideMessages();
  });

  tabRegister.addEventListener("click", () => {
    tabRegister.classList.add("active");
    tabLogin.classList.remove("active");
    registerForm.style.display = "block";
    loginForm.style.display = "none";
    hideMessages();
  });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMessages();
    const btn = document.getElementById("login-btn");
    btn.disabled = true; btn.textContent = "login...";

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

    btn.disabled = false; btn.textContent = "Login ";

    if (error) {
      showError(translateAuthError(error.message));
      return;
    }
    window.location.href = "index.html";
  });

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMessages();
    const btn = document.getElementById("reg-btn");
    btn.disabled = true; btn.textContent = "creating...";

    const username = document.getElementById("reg-username").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value;

    const { data, error } = await supabaseClient.auth.signUp({
      email, password,
      options: { data: { username } }
    });

    btn.disabled = false; btn.textContent = "Account created successful";

    if (error) {
      showError(translateAuthError(error.message));
      return;
    }

    if (data.session) {
      window.location.href = "index.html";
    } else {
      showMsg("Account created. Verify by checking your email.");
    }
  });

  // ============ RESET PASSWORD LINK ============
  const forgotLink = document.getElementById("forgot-password-link");
  if (forgotLink) {
    forgotLink.addEventListener("click", (e) => {
      e.preventDefault();
      openResetPasswordModal();
    });
  }
});

function showError(msg) {
  const el = document.getElementById("auth-error");
  el.textContent = msg;
  el.style.display = "block";
}

function showMsg(msg) {
  const el = document.getElementById("auth-msg");
  el.textContent = msg;
  el.style.display = "block";
}

function hideMessages() {
  document.getElementById("auth-error").style.display = "none";
  document.getElementById("auth-msg").style.display = "none";
}

function translateAuthError(msg) {
  if (/invalid login credentials/i.test(msg)) return "Wrong Email or Password";
  if (/already registered/i.test(msg)) return "Already logged in with this email";
  if (/password should be/i.test(msg)) return "Password must be at least 6 digits long.";
  return msg;
}

// ============ RESET PASSWORD MODAL ============
function openResetPasswordModal() {
  const modal = document.createElement('div');
  modal.id = 'reset-password-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  `;

  modal.innerHTML = `
    <div style="
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 30px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    ">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="font-size: 40px; margin-bottom: 12px;">🔐</div>
        <h2 style="
          color: var(--text);
          font-size: 20px;
          font-weight: 800;
          margin: 0;
        ">Reset Password</h2>
        <p style="
          color: var(--text-faint);
          font-size: 13px;
          margin-top: 8px;
        ">Enter your email to receive reset link</p>
      </div>

      <form id="reset-form" style="display: flex; flex-direction: column; gap: 16px;">
        <input 
          type="email" 
          id="reset-email" 
          placeholder="your@email.com" 
          required
          style="
            padding: 12px 14px;
            border: 1px solid var(--line);
            border-radius: 10px;
            background: var(--void);
            color: var(--text);
            font-size: 14px;
            font-family: inherit;
            transition: all 0.2s;
          "
          onfocus="this.style.borderColor='var(--cyan)'"
          onblur="this.style.borderColor='var(--line)'"
        >

        <button 
          type="submit" 
          style="
            padding: 12px;
            background: linear-gradient(135deg, var(--cyan) 0%, #0099cc 100%);
            color: var(--void);
            border: none;
            border-radius: 10px;
            font-weight: 800;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
          "
          onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0,229,255,0.3)'"
          onmouseout="this.style.transform='none'; this.style.boxShadow='none'"
        >
          Send Reset Link
        </button>
      </form>

      <div id="reset-message" style="
        margin-top: 16px;
        padding: 12px;
        border-radius: 8px;
        text-align: center;
        font-size: 13px;
        display: none;
      "></div>

      <button 
        onclick="document.getElementById('reset-password-modal').remove()" 
        style="
          width: 100%;
          margin-top: 16px;
          padding: 10px;
          background: transparent;
          border: 1px solid var(--line);
          color: var(--text-dim);
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        "
        onmouseover="this.style.borderColor='var(--text-dim)'"
        onmouseout="this.style.borderColor='var(--line)'"
      >
        Close
      </button>
    </div>
  `;

  document.body.appendChild(modal);

  const resetForm = document.getElementById('reset-form');
  const messageDiv = document.getElementById('reset-message');

  resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('reset-email').value.trim();
    const submitBtn = resetForm.querySelector('button[type="submit"]');
    
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Sending...';

    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email);

      if (error) throw error;

      messageDiv.style.display = 'block';
      messageDiv.style.background = 'rgba(0,229,255,0.1)';
      messageDiv.style.border = '1px solid rgba(0,229,255,0.2)';
      messageDiv.style.color = 'var(--cyan)';
      messageDiv.textContent = '✅ Check your email for reset link!';

      resetForm.style.display = 'none';

    } catch (err) {
      messageDiv.style.display = 'block';
      messageDiv.style.background = 'rgba(255,71,87,0.1)';
      messageDiv.style.border = '1px solid rgba(255,71,87,0.2)';
      messageDiv.style.color = '#ff4757';
      messageDiv.textContent = `❌ ${err.message || 'Error sending reset link'}`;

      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Reset Link';
    }
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}
