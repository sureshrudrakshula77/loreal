import { FormEvent, useState } from 'react';
import { assessClaim, AssessmentResponse } from './api';

const example = {
  claim: 'Reduces the appearance of wrinkles by 20% in 4 weeks',
  productFormula: 'Leave-on facial emulsion containing 0.3% encapsulated retinol; same batch and usage instructions as the tested product.',
  evidence: 'Randomized, evaluator-blinded, vehicle-controlled study in 120 adults aged 40–65. Participants used the product nightly for 4 weeks. The prespecified primary endpoint was change in validated wrinkle severity score. The product group improved 21.4% from baseline versus 5.1% for vehicle (between-group p < 0.01). 112 participants completed the study; analysis used intention-to-treat with multiple imputation.',
};

export function App() {
  const [form, setForm] = useState(example);
  const [result, setResult] = useState<AssessmentResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      setResult(await assessClaim(form));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assessment could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <header className="topbar">
        <div className="brand">L’ORÉAL <span>RESEARCH & INNOVATION</span></div>
        <div className="system-status"><i /> Claims Intelligence</div>
      </header>

      <section className="hero">
        <p className="eyebrow">SCIENTIFIC EVIDENCE REVIEW</p>
        <h1>Make every claim<br /><em>stand up to evidence.</em></h1>
        <p className="intro">Compare proposed product language with study results. Receive a structured, traceable assessment in seconds.</p>
      </section>

      <section className="workspace">
        <form onSubmit={submit} aria-label="Claim assessment form">
          <div className="form-heading">
            <span>01</span>
            <div><h2>Assessment brief</h2><p>Enter the exact claim, tested formula and clinical evidence.</p></div>
          </div>

          <label>Proposed claim <small>{form.claim.length} / 500</small>
            <input value={form.claim} onChange={(e) => setForm({ ...form, claim: e.target.value })} minLength={10} maxLength={500} required />
          </label>
          <div className="two-column">
            <label>Product formula
              <textarea value={form.productFormula} onChange={(e) => setForm({ ...form, productFormula: e.target.value })} minLength={10} required />
            </label>
            <label>Study evidence
              <textarea value={form.evidence} onChange={(e) => setForm({ ...form, evidence: e.target.value })} minLength={30} required />
            </label>
          </div>
          <div className="form-footer">
            <p><strong>Decision support, not final approval.</strong> Low-confidence outcomes are flagged for evaluator review.</p>
            <button disabled={loading}>{loading ? 'Assessing evidence…' : 'Assess claim'} <span>→</span></button>
          </div>
        </form>

        <aside aria-live="polite">
          <div className="form-heading">
            <span>02</span>
            <div><h2>Assessment result</h2><p>The model’s evidence-based recommendation.</p></div>
          </div>
          {!result && !error && <div className="empty"><div className="pulse">✦</div><h3>Ready for review</h3><p>Your structured assessment will appear here after submission.</p></div>}
          {error && <div className="error" role="alert"><strong>Unable to assess</strong><p>{error}</p></div>}
          {result && (
            <div className="result">
              <div className={`verdict ${result.justified ? 'yes' : 'no'}`}>
                <span>{result.justified ? '✓' : '×'}</span>
                <div><small>JUSTIFIED</small><strong>{result.justified ? 'Yes' : 'No'}</strong></div>
              </div>
              <div className="confidence"><span>Confidence</span><strong>{Math.round(result.confidence * 100)}%</strong><div><i style={{ width: `${result.confidence * 100}%` }} /></div></div>
              {result.reviewRequired && <p className="review">Human evaluator review required</p>}
              <div className="reasoning"><small>REASONING</small><p>{result.reasoning}</p></div>
              <p className="trace">Trace ID · {result.assessmentId}</p>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
