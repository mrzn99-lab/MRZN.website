/* ===================================================================
   MRZN SOUND SYSTEM
   - Click sound effects (synthesized in-browser, no audio files needed)
   - Voice narration / welcome message (browser's built-in Text-to-Speech)
   - Settings toggle (saved in localStorage, applies across all pages)

   NOTE: Browsers block autoplay sound/voice until the user interacts
   with the page (taps/clicks something) at least once. This is a
   browser security rule, not a bug — the welcome message will play
   right after the first tap if it didn't play immediately.
   =================================================================== */

const SOUND_KEY = "mrzn_sound_enabled";
const VOICE_KEY = "mrzn_voice_enabled";

function isSoundOn() {
  return localStorage.getItem(SOUND_KEY) !== "off"; // default: on
}
function isVoiceOn() {
  return localStorage.getItem(VOICE_KEY) !== "off"; // default: on
}

// ---------- CLICK SOUND (synthesized, no files) ----------
let audioCtx;
function playClickSound() {
  if (!isSoundOn()) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  } catch (e) { /* ignore if Web Audio isn't available */ }
}

// ---------- VOICE NARRATION (browser Text-to-Speech) ----------
function speak(text) {
  if (!isVoiceOn()) return;
  if (!("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel(); // stop anything currently speaking
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1;
    utter.pitch = 1;
    window.speechSynthesis.speak(utter);
  } catch (e) { /* ignore */ }
}

// ---------- WELCOME MESSAGE (once per browser session) ----------
function maybeSpeakWelcome() {
  if (sessionStorage.getItem("mrzn_welcomed")) return;
  sessionStorage.setItem("mrzn_welcomed", "1");
  speak("Welcome to MRZN Apps and Games.");
}

// ---------- GLOBAL CLICK SOUND DELEGATION ----------
document.addEventListener("click", (e) => {
  const clickable = e.target.closest(".btn, .app-card, .nav-icon-btn, .filter-chip, a");
  if (clickable) playClickSound();

  // first interaction unlocks audio/voice autoplay in most browsers
  maybeSpeakWelcome();
}, true);

// ---------- SETTINGS PANEL (gear icon, bottom-left) ----------
document.addEventListener("DOMContentLoaded", () => {
  const gear = document.createElement("button");
  gear.id = "mrzn-settings-toggle";
  gear.textContent = "⚙️";
  gear.style.cssText = `
    position:fixed; bottom:22px; left:22px; width:50px; height:50px;
    border-radius:50%; background:var(--panel-2); border:1px solid var(--line);
    font-size:20px; z-index:150; box-shadow:0 4px 14px rgba(0,0,0,0.4);
  `;
  document.body.appendChild(gear);

  const panel = document.createElement("div");
  panel.id = "mrzn-settings-panel";
  panel.style.cssText = `
    position:fixed; bottom:82px; left:22px; width:240px; z-index:150;
    background:var(--panel); border:1px solid var(--line); border-radius:12px;
    padding:16px; display:none; flex-direction:column; gap:12px;
    box-shadow:0 10px 30px rgba(0,0,0,0.5);
  `;
  panel.innerHTML = `
    <div style="font-family:var(--f-ui);font-weight:700;font-size:13.5px;margin-bottom:2px">Settings</div>
    <label style="display:flex;align-items:center;justify-content:space-between;font-size:13px;color:var(--text-dim)">
      Click sounds
      <input type="checkbox" id="mrzn-sound-check">
    </label>
    <label style="display:flex;align-items:center;justify-content:space-between;font-size:13px;color:var(--text-dim)">
      Voice narration
      <input type="checkbox" id="mrzn-voice-check">
    </label>
    <a href="settings.html" style="font-size:12.5px;color:var(--cyan);text-align:center;margin-top:4px">More settings →</a>
  `;
  document.body.appendChild(panel);

  const soundCheck = document.getElementById("mrzn-sound-check");
  const voiceCheck = document.getElementById("mrzn-voice-check");
  soundCheck.checked = isSoundOn();
  voiceCheck.checked = isVoiceOn();

  gear.addEventListener("click", (e) => {
    e.stopPropagation();
    panel.style.display = panel.style.display === "flex" ? "none" : "flex";
  });

  soundCheck.addEventListener("change", () => {
    localStorage.setItem(SOUND_KEY, soundCheck.checked ? "on" : "off");
  });
  voiceCheck.addEventListener("change", () => {
    localStorage.setItem(VOICE_KEY, voiceCheck.checked ? "on" : "off");
    if (voiceCheck.checked) speak("Voice narration enabled.");
    else window.speechSynthesis?.cancel();
  });

  document.addEventListener("click", (e) => {
    if (!panel.contains(e.target) && e.target !== gear) {
      panel.style.display = "none";
    }
  });
});
             
