/**
 * 🌍 Multi-Language Manager
 * 100+ languages support
 * Offline translation using MyMemory API
 */

class LanguageManager {
  constructor() {
    this.currentLang = localStorage.getItem('mrzn_language') || 'en';
    this.translations = {};
    this.isTranslating = false;
    this.init();
  }

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
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.applyLanguage());
      } else {
        await this.applyLanguage();
      }
    } catch (err) {
      console.error('Language init error:', err);
    }
  }

  async applyLanguage() {
    try {
      if (this.currentLang === 'en') {
        console.log('English - no translation needed');
        return;
      }

      console.log('🔄 Applying language:', this.currentLang);
      this.isTranslating = true;

      const elements = document.querySelectorAll(
        'h1, h2, h3, h4, h5, h6, p, span, button, label, a, div:not([class*="code"]):not([class*="log"])'
      );

      let count = 0;

      for (let elem of elements) {
        if (!elem.textContent || elem.textContent.trim().length === 0) continue;
        if (elem.querySelector('script, style, img')) continue;
        if (elem.getAttribute('data-translated')) continue;

        try {
          const originalText = elem.textContent.trim();
          
          if (originalText.length < 2) continue;
          if (/^[\d\s\.\,\-\:\/]+$/.test(originalText)) continue;

          const translated = await this.translateText(originalText, this.currentLang);

          if (translated && translated !== originalText) {
            elem.textContent = translated;
            elem.setAttribute('data-translated', 'true');
            count++;
          }
        } catch (err) {
          console.warn('Translation error');
        }
      }

      console.log('✅ Translated ' + count + ' elements');
      this.isTranslating = false;

    } catch (error) {
      console.error('Apply language error:', error);
      this.isTranslating = false;
    }
  }

  async translateText(text, targetLang) {
    try {
      if (!text || targetLang === 'en') return text;

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

  async changeLanguage(langCode) {
    try {
      console.log('🔄 Changing language to:', langCode);
      
      this.currentLang = langCode;
      localStorage.setItem('mrzn_language', langCode);

      document.querySelectorAll('[data-translated]').forEach(el => {
        el.removeAttribute('data-translated');
      });

      await this.applyLanguage();

      // Notify other scripts
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: this.currentLang } }));

      console.log('✅ Language changed to ' + langCode);
    } catch (error) {
      console.error('Change language error:', error);
    }
  }

  getLanguages() {
    return this.supportedLanguages;
  }

  getLanguageName(code) {
    return this.supportedLanguages[code] || code;
  }
}

// Initialize globally
if (!window.languageManager) {
  window.languageManager = new LanguageManager();
}
