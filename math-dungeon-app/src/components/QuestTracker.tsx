import type { Translation } from '../types';
import { formatTemplate } from '../utils/format';

interface Props {
  t: Translation;
  totalCombos: number;
}

const BADGE_STEPS = [
  { label: '✨', combos: 3 },
  { label: '☀️', combos: 8 },
  { label: '🏆', combos: 15 }
];

export const QuestTracker = ({ t, totalCombos }: Props) => {
  const nextStep = BADGE_STEPS.find(step => totalCombos < step.combos);
  const progressPercent = Math.min(100, Math.round((totalCombos / BADGE_STEPS[BADGE_STEPS.length - 1].combos) * 100));
  const nextLabel = nextStep
    ? formatTemplate(t.questLabel, { value: Math.max(0, nextStep.combos - totalCombos) })
    : t.questComplete;

  return (
    <section className="quest-card">
      <div className="quest-head">
        <div>
          <p className="eyebrow">{t.moodLabel}</p>
          <h2>{t.adventureTitle}</h2>
          <p className="muted">{t.adventureDescription}</p>
        </div>
        <div className="badges">
          {BADGE_STEPS.map(step => (
            <span key={step.combos} className={`badge ${totalCombos >= step.combos ? 'active' : ''}`}>
              {step.label}
              <span className="badge-count">×{step.combos}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="quest-progress">
        <div className="quest-progress-bar" style={{ width: `${progressPercent}%` }} />
      </div>
      <p className="quest-next">{nextLabel}</p>
    </section>
  );
};
