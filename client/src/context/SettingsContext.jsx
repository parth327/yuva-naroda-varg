import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const SettingsContext = createContext(null);
const DEFAULTS = { eventYear: 2026, minAge: 17, maxAge: 40 };

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(() => {
    return fetch('/api/settings')
      .then((r) => (r.ok ? r.json() : DEFAULTS))
      .then((data) => setSettings(data))
      .catch(() => setSettings(DEFAULTS))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <SettingsContext.Provider value={{ ...settings, loaded, refresh }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
