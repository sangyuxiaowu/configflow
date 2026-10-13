import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Language, TranslationDictionary } from './types';
import { zhLocale } from './locales/zh';
import { enLocale } from './locales/en';
import { Globe, Check } from 'lucide-react';

const STORAGE_KEY = 'opsconfig_lang';

/**
 * 依据需求检测默认语言：
 * 默认根据浏览器头（navigator.languages / navigator.language），
 * 中文就中文，其他的加载先加载英文。
 */
export function detectDefaultLanguage(): Language {
  if (typeof window === 'undefined') return 'en';

  // 1. 如果用户曾经手动选择并存储在本地缓存中，优先尊重用户选择
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'zh' || saved === 'en') {
      return saved as Language;
    }
  } catch {
    // ignore localStorage errors (e.g. private browsing)
  }

  // 2. 默认根据浏览器语言头检测：
  // 中文就中文，其他的（如 en, ja, fr, de, es 等）先加载英文
  const browserLangs = navigator.languages || [navigator.language || ''];
  const primaryLang = (browserLangs[0] || '').toLowerCase().trim();

  if (primaryLang.startsWith('zh')) {
    return 'zh';
  }

  return 'en';
}

interface I18nContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: TranslationDictionary;
  format: (template: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => detectDefaultLanguage());

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
    // 同步更新 document html 语言属性
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh');
  };

  // 初始化时同步 html lang 属性
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
      document.title = (language === 'zh' ? zhLocale : enLocale).common.pageTitle;
    }
  }, [language]);

  const dictionary = useMemo<TranslationDictionary>(() => {
    return language === 'zh' ? zhLocale : enLocale;
  }, [language]);

  const format = (template: string, vars?: Record<string, string | number>): string => {
    if (!vars) return template;
    let result = template;
    for (const [key, val] of Object.entries(vars)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
    }
    return result;
  };

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t: dictionary,
        format,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}

/**
 * 优雅的语言切换组件，供导航栏使用
 */
export const LanguageSwitcher: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { language, setLanguage, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
        title={t.nav.switchLanguage}
      >
        <Globe className="w-3.5 h-3.5 text-indigo-400" />
        <span className="whitespace-nowrap">
          {compact ? (language === 'zh' ? '中' : 'EN') : language === 'zh' ? '中文' : 'English'}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-1.5 w-36 origin-top-right rounded-xl bg-slate-900 border border-slate-700 p-1 shadow-2xl z-50 text-xs animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => {
                setLanguage('zh');
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                language === 'zh'
                  ? 'bg-indigo-600/30 text-indigo-200 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>简体中文</span>
              {language === 'zh' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setLanguage('en');
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                language === 'en'
                  ? 'bg-indigo-600/30 text-indigo-200 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>English</span>
              {language === 'en' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
