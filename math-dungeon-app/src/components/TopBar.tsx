import type { Locale, Translation } from '../types';

type Props = {
  language: Locale;
  languageOptions: { value: Locale; label: string }[];
  onLanguageChange: (value: Locale) => void;
  t: Translation;
  practiceMode: boolean;
  onTogglePractice: () => void;
};

export const TopBar = ({
  language,
  languageOptions,
  onLanguageChange,
  t,
  practiceMode,
  onTogglePractice
}: Props) => (
  <header className="game-header">
    <div>
      <p className="eyebrow">{t.adventureTitle}</p>
      <h1>{t.gameTitle}</h1>
      <p>{t.subtitle}</p>
    </div>
    <div className="top-actions">
      <label className="language-select">
        <span>{t.languageSelectLabel}</span>
        <select value={language} onChange={event => onLanguageChange(event.target.value as Locale)}>
          {languageOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <button className="pill-button" type="button" onClick={onTogglePractice}>
        <span className="pill-label">{t.practiceModeLabel}</span>
        <span className="pill-value">{practiceMode ? t.practiceModeOn : t.practiceModeOff}</span>
      </button>
    </div>
  </header>
);
