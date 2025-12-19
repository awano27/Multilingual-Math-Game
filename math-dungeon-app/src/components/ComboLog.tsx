import type { Translation, ComboDetail } from '../types';
import { formatTemplate } from '../utils/format';

interface Props {
  t: Translation;
  combos: ComboDetail[];
  formatNumber: (value: number) => string;
}

export const ComboLog = ({ t, combos, formatNumber }: Props) => (
  <section className="panel combo-log">
    <h2>{t.lastComboTitle}</h2>
    {combos.length === 0 ? (
      <p className="muted">{t.noCombosYet}</p>
    ) : (
      <ul>
        {combos.map((combo, index) => {
          const cascadeLabel = formatTemplate(t.cascadeLabelTemplate, {
            value: formatNumber(combo.cascade)
          });
          const line = formatTemplate(t.comboLineTemplate, {
            index: index + 1,
            element: t.elementNames[combo.type],
            count: formatNumber(combo.size),
            points: formatNumber(combo.points),
            unit: t.pointsUnit,
            cascade: cascadeLabel
          });
          return <li key={`${combo.type}-${index}`}>{line}</li>;
        })}
      </ul>
    )}
  </section>
);
