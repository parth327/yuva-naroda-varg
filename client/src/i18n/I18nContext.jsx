import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { translations } from './translations';

const I18nContext = createContext(null);
const STORAGE_KEY = 'ysLang';

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'gu';
    } catch {
      return 'gu';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  const setLang = useCallback((next) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore (private-browsing / storage blocked)
    }
  }, []);

  const t = useCallback(
    (key, vars) => {
      const dict = translations[lang] || translations.gu;
      let str = dict[key] ?? translations.gu[key] ?? key;
      if (vars) {
        Object.keys(vars).forEach((k) => {
          str = str.replaceAll(`{${k}}`, vars[k]);
        });
      }
      return str;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider');
  return ctx;
}
