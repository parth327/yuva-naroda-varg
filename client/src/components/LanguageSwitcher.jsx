import { useTranslation } from '../i18n/I18nContext';

export default function LanguageSwitcher({ className }) {
  const { lang, setLang } = useTranslation();
  return (
    <select
      className={className || 'ys-lang-select'}
      value={lang}
      onChange={(e) => setLang(e.target.value)}
      aria-label="Language / ભાષા"
    >
      <option value="gu">ગુજરાતી</option>
      <option value="en">English</option>
    </select>
  );
}
