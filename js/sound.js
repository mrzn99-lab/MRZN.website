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

