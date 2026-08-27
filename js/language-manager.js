/**
 * 🌍 Language Manager - FIXED
 * Only translate text nodes, preserve design + buttons
 */

class LanguageManager {
  constructor() {
    this.currentLang = localStorage.getItem('mrzn_language') || 'en';
    this.supportedLanguages = {
      'en': 'English',
      'bn': 'Bengali (বাংলা)',
      'hi': 'Hindi (हिंदी)',
      'es': 'Spanish (Español)',
      'fr': 'French (Français)',
      'de': 'German (Deutsch)',
      'it': 'Italian (Italiano)',
      'pt': 'Portuguese (Português)',
      'ru': 'Russian (Русский)',
      'ja': 'Japanese (日本語)',
      'ko': 'Korean (한국어)',
      'zh': 'Chinese (中文)',
      'ar': 'Arabic (العربية)',
      'tr': 'Turkish (Türkçe)',
      'pl': 'Polish (Polski)',
      'nl': 'Dutch (Nederlands)',
      'sv': 'Swedish (Svenska)',
      'no': 'Norwegian (Norsk)',
      'da': 'Danish (Dansk)',
      'fi': 'Finnish (Suomi)',
      'cs': 'Czech (Čeština)',
      'sk': 'Slovak (Slovenčina)',
      'hu': 'Hungarian (Magyar)',
      'ro': 'Romanian (Română)',
      'el': 'Greek (Ελληνικά)',
      'th': 'Thai (ไทย)',
      'vi': 'Vietnamese (Tiếng Việt)',
      'id': 'Indonesian (Bahasa Indonesia)',
      'ms': 'Malay (Bahasa Melayu)',
      'ph': 'Filipino (Tagalog)',
      'uk': 'Ukrainian (Українська)',
      'he': 'Hebrew (עברית)',
      'fa': 'Persian (فارسی)',
      'ur': 'Urdu (اردو)',
      'pa': 'Punjabi (ਪੰਜਾਬੀ)',
      'ta': 'Tamil (தமிழ்)',
      'te': 'Telugu (తెలుగు)',
      'kn': 'Kannada (ಕನ್ನಡ)',
      'ml': 'Malayalam (മലയാളം)',
      'gu': 'Gujarati (ગુજરાતી)',
      'mr': 'Marathi (मराठी)',
    };
  }

  init() {
    console.log('🌍 Language Manager initialized');
  }

  getLanguages() {
    return this.supportedLanguages;
  }

  getLanguageName(code) {
    return this.supportedLanguages[code] || code;
  }

  async changeLanguage(langCode) {
    if (!this.supportedLanguages[langCode]) {
      console.warn('Unknown language:', langCode);
      return;
    }

    this.currentLang = langCode;
    localStorage.setItem('mrzn_language', langCode);

    console.log('🌐 Changed to:', langCode);

    // Dispatch event for other scripts
    window.dispatchEvent(new Event('languageChanged'));
  }

  async translateText(text, targetLang) {
    if (!text || targetLang === 'en') return text;
    if (text.length < 2) return text;

    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`
      );
      const data = await response.json();
      return data.responseData?.translatedText || text;
    } catch (error) {
      console.warn('Translation error:', error);
      return text;
    }
  }

  // IMPORTANT: Only translate text nodes, preserve HTML structure
  async applyLanguage() {
    if (this.currentLang === 'en') return;

    console.log('🌐 Applying language:', this.currentLang);

    try {
      // Get all text nodes
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      let node;
      let count = 0;
      const nodesToTranslate = [];

      // Collect all text nodes
      while (node = walker.nextNode()) {
        const text = node.textContent.trim();

        // Skip empty, very short, numbers-only, or script content
        if (!text || text.length < 2 || /^[\d\s\.\,\-\:\/\(\)]+$/.test(text)) {
          continue;
        }

        // Skip common UI labels (already translated elsewhere)
        if (['Home', 'Browse Apps', 'Profile', 'Settings', '🏠', '📱', '👤', '⚙️', 'Log In', 'Sign Up'].includes(text)) {
          continue;
        }

        // Skip elements inside script, style, code
        let parent = node.parentElement;
        if (parent?.tagName === 'SCRIPT' || parent?.tagName === 'STYLE' || parent?.tagName === 'CODE') {
          continue;
        }

        nodesToTranslate.push(node);
      }

      console.log('📝 Found', nodesToTranslate.length, 'nodes to translate');

      // Translate each node
      for (let textNode of nodesToTranslate) {
        try {
          const original = textNode.textContent.trim();
          const translated = await this.translateText(original, this.currentLang);

          if (translated && translated !== original) {
            textNode.textContent = translated;
            count++;
          }
        } catch (err) {
          console.warn('Node translation error');
        }
      }

      console.log('✅ Translated', count, 'text nodes');

    } catch (error) {
      console.error('Apply language error:', error);
    }
  }
}

window.languageManager = new LanguageManager();
window.languageManager.init();

// Apply language on page load
if (window.languageManager.currentLang !== 'en') {
  window.languageManager.applyLanguage();
}

// Re-apply when language changes
window.addEventListener('languageChanged', () => {
  window.languageManager.applyLanguage();
});
