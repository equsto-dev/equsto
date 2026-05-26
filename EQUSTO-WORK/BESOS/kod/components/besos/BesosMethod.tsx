import type { BesosMethodStep } from "@/lib/besos/types";

type Props = {
  steps: BesosMethodStep[];
};

export default function BesosMethod({ steps }: Props) {
  return (
    <section className="bd-vl-method" aria-label="Yöntemimiz">
      <div className="bd-vl-method-head">
        <h2>Yöntemimiz</h2>
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
