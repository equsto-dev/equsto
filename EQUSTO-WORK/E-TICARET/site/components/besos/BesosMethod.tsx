import type { BesosLocale } from "@/lib/besos/locale";
import { localizeMethodStep } from "@/lib/besos/locale";
import { besosUi } from "@/lib/besos/ui-strings";
import type { BesosMethodStep } from "@/lib/besos/types";

type Props = {
  steps: BesosMethodStep[];
  locale?: BesosLocale;
};

export default function BesosMethod({ steps, locale = "tr" }: Props) {
  return (
    <section className="bd-vl-method" aria-label={besosUi("methodAria", locale)}>
      <div className="bd-vl-method-head">
        <h2>{besosUi("methodKicker", locale)}</h2>
      </div>
      <ol className="bd-vl-method-list">
        {steps.map((step) => {
          const item = localizeMethodStep(step, locale);
          return (
            <li key={step.n}>
              <h3>
                {item.title}
                <sup>{item.n}</sup>
              </h3>
              <p>{item.text}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
