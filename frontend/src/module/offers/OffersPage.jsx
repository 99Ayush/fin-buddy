import React, { useState } from 'react';
import './OffersPage.css';

const OFFERS = [
  {
    id: 'A',
    company: 'TCS (Current)',
    ctc: 10.5,
    base: 7.2,
    bonus: 1.0,
    pf: 0.72,
    gratuity: 0.5,
    inHand: 68400,
    tag: 'current',
  },
  {
    id: 'B',
    company: 'Wipro (Offer)',
    ctc: 12.0,
    base: 8.4,
    bonus: 1.5,
    pf: 0.84,
    gratuity: 0.6,
    inHand: 77200,
    tag: 'offer',
  },
];

function fmt(n) { return `₹${n.toLocaleString('en-IN')}`; }
function fmtL(n) { return `₹${n} LPA`; }

export default function OffersPage() {
  const [offers] = useState(OFFERS);
  const [negotiation, setNegotiation] = useState({ base: '', variable: '', joining: '' });

  const best = offers.reduce((a, b) => (a.inHand > b.inHand ? a : b));

  return (
    <div className="offers-page">
      <div className="offers-header">
        <div>
          <h2>Offers &amp; Negotiate</h2>
          <p>Compare employment offers and simulate negotiation scenarios.</p>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="comparison-card">
        <h3 className="card-heading">Side-by-Side Comparison</h3>
        <div className="compare-grid">
          <div className="compare-label-col">
            <div className="compare-row-label">&nbsp;</div>
            <div className="compare-row-label">CTC (LPA)</div>
            <div className="compare-row-label">Base Pay</div>
            <div className="compare-row-label">Bonus</div>
            <div className="compare-row-label">PF</div>
            <div className="compare-row-label">Gratuity</div>
            <div className="compare-row-label highlight">Monthly In-Hand</div>
          </div>
          {offers.map((o) => (
            <div key={o.id} className={`compare-col ${o.tag} ${o.id === best.id ? 'best-col' : ''}`}>
              <div className="compare-company">
                {o.company}
                {o.id === best.id && <span className="best-badge">Best</span>}
              </div>
              <div className="compare-cell">{fmtL(o.ctc)}</div>
              <div className="compare-cell">{fmtL(o.base)}</div>
              <div className="compare-cell">{fmtL(o.bonus)}</div>
              <div className="compare-cell">{fmtL(o.pf)}</div>
              <div className="compare-cell">{fmtL(o.gratuity)}</div>
              <div className="compare-cell highlight big">{fmt(o.inHand)} /mo</div>
            </div>
          ))}
        </div>
      </div>

      {/* Negotiation Simulator */}
      <div className="negotiation-card">
        <h3 className="card-heading">Negotiation Simulator</h3>
        <p className="card-sub">
          Adjust salary components to see the impact on your in-hand pay.
        </p>
        <div className="neg-form">
          <label className="neg-label">
            Desired Base (LPA)
            <input
              id="neg-base"
              type="number"
              className="neg-input"
              placeholder="e.g. 9.0"
              value={negotiation.base}
              onChange={(e) => setNegotiation({ ...negotiation, base: e.target.value })}
            />
          </label>
          <label className="neg-label">
            Variable / Bonus (LPA)
            <input
              id="neg-variable"
              type="number"
              className="neg-input"
              placeholder="e.g. 2.0"
              value={negotiation.variable}
              onChange={(e) => setNegotiation({ ...negotiation, variable: e.target.value })}
            />
          </label>
          <label className="neg-label">
            Joining Bonus (₹)
            <input
              id="neg-joining"
              type="number"
              className="neg-input"
              placeholder="e.g. 100000"
              value={negotiation.joining}
              onChange={(e) => setNegotiation({ ...negotiation, joining: e.target.value })}
            />
          </label>
        </div>
        {(negotiation.base || negotiation.variable) && (
          <div className="neg-result">
            <span className="neg-result-label">Estimated Monthly In-Hand:</span>
            <span className="neg-result-value">
              {fmt(Math.round(
                ((parseFloat(negotiation.base) || 0) * 100000 * 0.72 +
                  (parseFloat(negotiation.variable) || 0) * 100000 * 0.08) / 12
              ))}
            </span>
            <span className="neg-disclaimer">(approximate, before taxes)</span>
          </div>
        )}
      </div>
    </div>
  );
}
