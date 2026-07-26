/* ===================================================================
   MRZN SETTINGS — APPLIES SAVED PREFERENCES ON EVERY PAGE
   Include this on every HTML page (after utils.js) so accent color,
   font size, compact mode, and animation preferences persist site-wide.
   =================================================================== */

const ACCENT_PRESETS = {
  blue:   { cyan: "#00e5ff", violet: "#3d7bff" },
  green:  { cyan: "#39ff88", violet: "#00c2a8" },
  purple: { cyan: "#b829f7", violet: "#7b2ff7" },
  red:    { cyan: "#ff4d6d", violet: "#ff2d55" },
};

function applyStoredSettings() {
  const root = document.documentElement;

  // accent color
  const accent = localStorage.getItem("mrzn_accent") || "blue";
  const preset = ACCENT_PRESETS[accent] || ACCENT_PRESETS.blue;
  root.style.setProperty("--cyan", preset.cyan);
  root.style.setProperty("--violet", preset.violet);

  // font size
  const fontSize = localStorage.getItem("mrzn_font_size") || "medium";
  const scale = { small: "14px", medium: "16px", large: "18px" }[fontSize] || "16px";
  root.style.fontSize = scale;

  // compact mode
  document.body?.classList.toggle("compact-mode", localStorage.getItem("mrzn_compact") === "on");

  // animations
  const animOff = localStorage.getItem("mrzn_animations") === "off";
  if (animOff) {
    root.classList.add("mrzn-no-animations");
  }
}

// run immediately (before DOMContentLoaded) to avoid a flash of unstyled content
applyStoredSettings();
document.addEventListener("DOMContentLoaded", applyStoredSettings);
