import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { Board } from './components/Board';
import { ComboLog } from './components/ComboLog';
import { Instructions } from './components/Instructions';
import { QuestTracker } from './components/QuestTracker';
import { StatsPanel } from './components/StatsPanel';
import { TopBar } from './components/TopBar';
import { MAX_TURNS, NUMBER_LOCALES } from './gameConfig';
import { useGameEngine } from './hooks/useGameEngine';
import { TRANSLATIONS } from './translations';
import type { Locale } from './types';

const languageOptions = (Object.keys(TRANSLATIONS) as Locale[]).map(locale => ({
  value: locale,
  label: TRANSLATIONS[locale].languageName
}));

const App = () => {
  const [language, setLanguage] = useState<Locale>('ja');
  const [practiceMode, setPracticeMode] = useState(true);
  const t = useMemo(() => TRANSLATIONS[language], [language]);
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(NUMBER_LOCALES[language]),
    [language]
  );

  const turnLimit = practiceMode ? null : MAX_TURNS;
  const {
    board,
    selected,
    score,
    turns,
    totalCombos,
    lastCombos,
    message,
    setMessage,
    handleReset,
    handlePointerDown
  } = useGameEngine(t, turnLimit);

  useEffect(() => {
    setMessage(t.messageReady);
  }, [t, setMessage]);

  useEffect(() => {
    handleReset();
  }, [practiceMode, handleReset]);

  const formattedTurns = practiceMode
    ? '∞'
    : numberFormatter.format(Math.max(0, Math.floor(turns)));
  const formattedScore = numberFormatter.format(score);
  const formattedComboTotal = numberFormatter.format(totalCombos);
  const isOutOfTurns = turnLimit !== null && turns <= 0;

  const togglePractice = () => setPracticeMode(prev => !prev);

  return (
    <div className="game-shell">
      <div className="game-card">
        <TopBar
          language={language}
          languageOptions={languageOptions}
          onLanguageChange={value => setLanguage(value)}
          practiceMode={practiceMode}
          onTogglePractice={togglePractice}
          t={t}
        />

        <StatsPanel
          t={t}
          turnsLabel={formattedTurns}
          scoreLabel={`${formattedScore} ${t.pointsUnit}`}
          comboLabel={formattedComboTotal}
        />

        <QuestTracker t={t} totalCombos={totalCombos} />

        <div className="game-body">
          <Board
            board={board}
            selected={selected}
            onPointerDown={handlePointerDown}
            t={t}
            onReset={handleReset}
            message={isOutOfTurns ? t.outOfTurns : message}
            isOutOfTurns={isOutOfTurns}
          />

          <aside className="sidebar">
            <Instructions t={t} />
            <ComboLog t={t} combos={lastCombos} formatNumber={value => numberFormatter.format(value)} />
          </aside>
        </div>
      </div>
    </div>
  );
};

export default App;
