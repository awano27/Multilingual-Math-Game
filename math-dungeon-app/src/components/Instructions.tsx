import type { Translation } from '../types';

interface Props {
  t: Translation;
}

export const Instructions = ({ t }: Props) => (
  <section className="panel instructions">
    <h2>{t.instructionsTitle}</h2>
    <ol>
      {t.instructions.map((step, index) => (
        <li key={index}>{step}</li>
      ))}
    </ol>
  </section>
);
