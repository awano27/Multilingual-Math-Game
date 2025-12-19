import type { Translation } from '../types';

interface Props {
  t: Translation;
  turnsLabel: string;
  scoreLabel: string;
  comboLabel: string;
}

export const StatsPanel = ({ t, turnsLabel, scoreLabel, comboLabel }: Props) => (
  <section className="scoreboard">
    <div className="stat-card">
      <span className="stat-label">{t.statsLabels.turns}</span>
      <span className="stat-value soft">{turnsLabel}</span>
    </div>
    <div className="stat-card">
      <span className="stat-label">{t.statsLabels.score}</span>
      <span className="stat-value highlight">{scoreLabel}</span>
    </div>
    <div className="stat-card">
      <span className="stat-label">{t.statsLabels.combos}</span>
      <span className="stat-value soft">{comboLabel}</span>
    </div>
  </section>
);
