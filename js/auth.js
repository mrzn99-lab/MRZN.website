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
    btn.disabled = true; btn.textContent = "লগইন হচ্ছে...";

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
      showMsg("Account created.Verify by checking your email. ");
    }
  });
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
