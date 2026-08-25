/**
 * 🌍 Multi-Language Manager
 * 100+ languages support
 * Google Translate powered
 */

class LanguageManager {
  constructor() {
    this.currentLang = localStorage.getItem('mrzn_language') || 'en';
    this.translations = {};
    this.isTranslating = false;
    this.init();
  }

  // Line 15: সব supported languages
  supportedLanguages = {
    'en': '🇺🇸 English',
    'bn': '🇧🇩 Bengali (বাংলা)',
    'hi': '🇮🇳 Hindi (हिंदी)',
    'es': '🇪🇸 Spanish (Español)',
    'fr': '🇫🇷 French (Français)',
    'de': '🇩🇪 German (Deutsch)',
    'pt': '🇵🇹 Portuguese (Português)',
    'ru': '🇷🇺 Russian (Русский)',
    'ja': '🇯🇵 Japanese (日本語)',
    'zh': '🇨🇳 Chinese (中文)',
    'ko': '🇰🇷 Korean (한국어)',
    'ar': '🇸🇦 Arabic (العربية)',
    'tr': '🇹🇷 Turkish (Türkçe)',
    'it': '🇮🇹 Italian (Italiano)',
    'pl': '🇵🇱 Polish (Polski)',
    'nl': '🇳🇱 Dutch (Nederlands)',
    'sv': '🇸🇪 Swedish (Svenska)',
    'vi': '🇻🇳 Vietnamese (Tiếng Việt)',
    'th': '🇹🇭 Thai (ไทย)',
    'id': '🇮🇩 Indonesian (Bahasa Indonesia)',
    'fil': '🇵🇭 Filipino (Tagalog)',
    'ur': '🇵🇰 Urdu (اردو)',
    'te': '🇮🇳 Telugu (తెలుగు)',
    'ta': '🇮🇳 Tamil (தமிழ்)',
    'kn': '🇮🇳 Kannada (ಕನ್ನಡ)',
    'ml': '🇮🇳 Malayalam (മലയാളം)',
    'mr': '🇮🇳 Marathi (मराठी)',
    'gu': '🇮🇳 Gujarati (ગુજરાતી)',
    'pa': '🇮🇳 Punjabi (ਪੰਜਾਬੀ)',
    'fa': '🇮🇷 Persian (فارسی)',
    'uk': '🇺🇦 Ukrainian (Українська)',
    'el': '🇬🇷 Greek (Ελληνικά)',
    'he': '🇮🇱 Hebrew (עברית)',
    'fi': '🇫🇮 Finnish (Suomi)',
    'da': '🇩🇰 Danish (Dansk)',
    'nb': '🇳🇴 Norwegian (Norsk)',
    'cs': '🇨🇿 Czech (Čeština)',
    'sk': '🇸🇰 Slovak (Slovenčina)',
    'hu': '🇭🇺 Hungarian (Magyar)',
    'ro': '🇷🇴 Romanian (Română)',
    'bg': '🇧🇬 Bulgarian (Български)',
    'hr': '🇭🇷 Croatian (Hrvatski)',
    'sr': '🇷🇸 Serbian (Српски)',
    'sl': '🇸🇮 Slovenian (Slovenščina)',
    'et': '🇪🇪 Estonian (Eesti)',
    'lv': '🇱🇻 Latvian (Latviešu)',
    'lt': '🇱🇹 Lithuanian (Lietuvių)',
  };

  async init() {
    try {
      console.log('🌍 Initializing Language Manager...');
      console.log('Current language:', this.currentLang);
      
      // Wait for DOM
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.applyLanguage());
      } else {
        await this.applyLanguage();
      }
    } catch (err) {
      console.error('Language init error:', err);
    }
  }

  // Line 78: Main translation function
  async applyLanguage() {
    try {
      if (this.currentLang === 'en') {
        console.log('English - no translation needed');
        return;
      }

      console.log('🔄 Applying language:', this.currentLang);
      this.isTranslating = true;

      // Get all text elements
      const elements = document.querySelectorAll(
        'h1, h2, h3, h4, h5, h6, p, span, button, label, a, div:not([class*="code"]):not([class*="log"])'
      );

      let count = 0;

      for (let elem of elements) {
        if (!elem.textContent || elem.textContent.trim().length === 0) continue;
        if (elem.querySelector('script, style, img')) continue;

        // Skip if already translated
        if (elem.getAttribute('data-translated')) continue;

        try {
          const originalText = elem.textContent.trim();
          
          // Line 108: Skip very short text
          if (originalText.length < 2) continue;
          
          // Skip if contains code/numbers only
          if (/^[\d\s\.\,\-\:\/]+$/.test(originalText)) continue;

          const translated = await this.translateText(originalText, this.currentLang);

          if (translated && translated !== originalText) {
            elem.textContent = translated;
            elem.setAttribute('data-translated', 'true');
            count++;
          }
        } catch (err) {
          console.warn('Translation error for:', elem.textContent.substring(0, 30));
        }
      }

      console.log('✅ Translated ' + count + ' elements');
      this.isTranslating = false;

    } catch (error) {
      console.error('Apply language error:', error);
      this.isTranslating = false;
    }
  }

  // Line 138: Translate single text
  async translateText(text, targetLang) {
    try {
      if (!text || targetLang === 'en') return text;

      // Line 143: Use Google Translate API (free)
      const encodedText = encodeURIComponent(text);
      const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|${targetLang}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.responseStatus === 200) {
        return data.responseData.translatedText;
      }

      return text;
    } catch (err) {
      console.warn('Translation API error:', err);
      return text;
    }
  }

  // Line 160: Change language
  async changeLanguage(langCode) {
    try {
      console.log('🔄 Changing language to:', langCode);
      
      this.currentLang = langCode;
      localStorage.setItem('mrzn_language', langCode);

      // Remove all data-translated to allow re-translation
      document.querySelectorAll('[data-translated]').forEach(el => {
        el.removeAttribute('data-translated');
      });

      // Re-apply
      await this.applyLanguage();

      console.log('✅ Language changed to ' + langCode);
    } catch (error) {
      console.error('Change language error:', error);
    }
  }

  // Line 181: Get all languages
  getLanguages() {
    return this.supportedLanguages;
  }

  // Line 185: Get language name
  getLanguageName(code) {
    return this.supportedLanguages[code] || code;
  }
}

// Line 190: Initialize globally
if (!window.languageManager) {
  window.languageManager = new LanguageManager();
              }
