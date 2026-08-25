/**
 * 📱 App Details Page - Language Support
 * Translate app description based on selected language
 */

async function applyLanguageToAppDetails() {
  try {
    if (!window.languageManager) {
      console.warn('Language manager not ready');
      return;
    }

    const currentLang = window.languageManager.currentLang;
    if (currentLang === 'en') return; // English, no translation needed

    console.log('🌐 Translating app details to:', currentLang);

    // Target elements for translation
    const elementsToTranslate = [
      'h1, h2, h3', // Headings
      'p',           // Paragraphs
      'span',        // Spans
      '[class*="description"]', // Description classes
      '[class*="about"]',       // About classes
    ];

    const selector = elementsToTranslate.join(', ');
    const elements = document.querySelectorAll(selector);

    let count = 0;

    for (let elem of elements) {
      // Skip empty elements
      if (!elem.textContent || elem.textContent.trim().length < 2) continue;
      
      // Skip if already translated
      if (elem.getAttribute('data-translated')) continue;
      
      // Skip code blocks, scripts, etc
      if (elem.querySelector('script, style, img, button')) continue;

      try {
        const text = elem.textContent.trim();
        
        // Skip numbers only
        if (/^[\d\s\.\,\-\:\/]+$/.test(text)) continue;

        console.log('Translating:', text.substring(0, 40));

        const translated = await window.languageManager.translateText(text, currentLang);

        if (translated && translated !== text) {
          elem.textContent = translated;
          elem.setAttribute('data-translated', 'true');
          count++;
        }
      } catch (err) {
        console.warn('Translation error for element');
      }
    }

    console.log('✅ App details translated - ' + count + ' elements');

  } catch (error) {
    console.error('App translation error:', error);
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Wait for language manager
    const checkLangManager = setInterval(() => {
      if (window.languageManager) {
        clearInterval(checkLangManager);
        applyLanguageToAppDetails();
      }
    }, 100);
  });
} else {
  applyLanguageToAppDetails();
}

// Re-translate when language changes
window.addEventListener('languageChanged', () => {
  // Remove all translations to re-apply
  document.querySelectorAll('[data-translated]').forEach(el => {
    el.removeAttribute('data-translated');
  });
  
  // Re-apply language
  applyLanguageToAppDetails();
});
