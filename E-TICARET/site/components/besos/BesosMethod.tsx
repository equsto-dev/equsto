import type { BesosMethodStep } from "@/lib/besos/types";

type Props = {
  steps: BesosMethodStep[];
};

export default function BesosMethod({ steps }: Props) {
  return (
    <section className="bd-vl-method" aria-label="Yöntemimiz" data-i18n-attr="aria-label:besos.method_aria">
      <div className="bd-vl-method-head">
        <h2 data-i18n="besos.method_kicker">Yöntemimiz</h2>
      </div>
      <ol className="bd-vl-method-list">
        {steps.map((step) => (
          <li key={step.n}>
            <h3>
              {step.title}
              <sup>{step.n}</sup>
            </h3>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
