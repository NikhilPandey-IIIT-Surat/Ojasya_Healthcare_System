import React, { useState } from 'react';
import axios from 'axios';

const ALL_SYMPTOMS = [
  'fatigue', 'pale skin', 'shortness of breath', 'dizziness', 'cold hands',
  'brittle nails', 'headaches', 'bone pain', 'muscle weakness', 'depression',
  'hair loss', 'slow wound healing', 'frequent illness', 'numbness tingling hands feet',
  'memory problems', 'mood changes', 'muscle cramps', 'numbness', 'dental problems',
  'anxiety', 'insomnia', 'irregular heartbeat', 'constipation', 'irritability',
  'joint pain', 'bleeding gums', 'rough bumpy skin', 'frequent colds',
  'loss of taste smell', 'poor wound healing', 'diarrhea', 'eye skin problems',
  'dry skin', 'poor memory', 'dry eyes', 'chest pain', 'weakness', 'mouth sores',
  'back pain', 'leg cramps', 'brain fog', 'difficulty concentrating'
];

export default function NutritionCheck() {
  const [selected, setSelected] = useState([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleSymptom = (s) => {
    setSelected(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const addCustom = () => {
    const trimmed = customSymptom.trim().toLowerCase();
    if (trimmed && !selected.includes(trimmed)) {
      setSelected(prev => [...prev, trimmed]);
      setCustomSymptom('');
    }
  };

  const checkNutrition = async () => {
    if (selected.length === 0) return;
    setLoading(true);
    setError('');
    setResults(null);
    try {
      const res = await axios.post('/api/nutrition/check', { symptoms: selected });
      setResults(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to analyze. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setSelected([]);
    setResults(null);
    setError('');
    setCustomSymptom('');
  };

  const severityColor = (s) => ({ mild: '#27ae60', moderate: '#d4ac0d', severe: '#c0392b' }[s] || '#777');
  const severityBg = (s) => ({ mild: '#d5f5e3', moderate: '#fef9e7', severe: '#fadbd8' }[s] || '#f0f0f0');

  return (
    <div>
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3>🥗 Nutritional Deficiency Checker</h3>
          {selected.length > 0 && (
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {selected.length} symptom{selected.length !== 1 ? 's' : ''} selected
            </span>
          )}
        </div>

        <p className="text-muted" style={{ marginBottom: 16 }}>
          Click your symptoms below. The system will suggest possible nutritional deficiencies with recommended nutrients and foods.
        </p>

        <div className="symptom-tags">
          {ALL_SYMPTOMS.map(s => (
            <button
              key={s}
              className={`symptom-tag ${selected.includes(s) ? 'selected' : ''}`}
              onClick={() => toggleSymptom(s)}
            >
              {selected.includes(s) ? '✓ ' : ''}{s}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <input
            className="form-control"
            placeholder="Add a custom symptom and press Enter..."
            value={customSymptom}
            onChange={e => setCustomSymptom(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
            style={{ flex: 1 }}
          />
          <button className="btn btn-outline btn-sm" onClick={addCustom} disabled={!customSymptom.trim()}>
            Add
          </button>
        </div>

        {selected.length > 0 && (
          <div style={{ marginTop: 16, padding: '12px 14px', background: '#eaf2fb', borderRadius: 8, border: '1px solid #b3d9f7' }}>
            <strong style={{ fontSize: 13, color: 'var(--primary)' }}>Selected ({selected.length}):</strong>
            <div className="symptom-tags" style={{ marginTop: 8 }}>
              {selected.map(s => (
                <button key={s} className="symptom-tag selected" onClick={() => toggleSymptom(s)}>
                  {s} ×
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-error" style={{ marginTop: 16 }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ marginTop: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            className="btn btn-accent"
            onClick={checkNutrition}
            disabled={loading || selected.length === 0}
          >
            {loading ? '⏳ Analyzing...' : '🔍 Analyze Symptoms'}
          </button>
          <button className="btn btn-outline" onClick={clearAll} disabled={loading}>
            Clear All
          </button>
          {selected.length === 0 && (
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Select at least one symptom above</span>
          )}
        </div>
      </div>

      {results !== null && (
        <div>
          {results.length === 0 ? (
            <div className="card">
              <div className="empty-state" style={{ padding: 40 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🤔</div>
                <p style={{ fontWeight: 600, marginBottom: 8 }}>No matches found</p>
                <p className="text-muted">Try selecting more symptoms or consult a doctor.</p>
                <button className="btn btn-outline btn-sm" style={{ marginTop: 16 }} onClick={clearAll}>Try again</button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ color: 'var(--primary)' }}>Analysis Results</h3>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {results.length} possible condition{results.length !== 1 ? 's' : ''} found
                </span>
              </div>

              {results.map((r, i) => (
                <div key={r.id} className="nutrition-result" style={{ borderLeftColor: i === 0 ? 'var(--accent)' : '#ccc', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                        background: i === 0 ? 'var(--accent)' : '#e0e0e0',
                        color: i === 0 ? 'white' : 'var(--text-muted)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700
                      }}>{i + 1}</div>
                      <div>
                        <h4 style={{ color: 'var(--primary)', fontSize: 16, marginBottom: 2 }}>{r.condition_name}</h4>
                        {i === 0 && <span style={{ fontSize: 11, color: 'var(--accent-dark)', fontWeight: 600 }}>MOST LIKELY MATCH</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: '#d5f5e3', color: '#1e8449', fontWeight: 600 }}>
                        {r.match_count}/{selected.length} matched
                      </span>
                      {r.severity && (
                        <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: severityBg(r.severity), color: severityColor(r.severity), fontWeight: 600, textTransform: 'capitalize' }}>
                          {r.severity}
                        </span>
                      )}
                    </div>
                  </div>

                  {r.match_symptoms?.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Matched Symptoms</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {r.match_symptoms.map(s => (
                          <span key={s} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: '#d5f5e3', color: '#1e8449', fontWeight: 500 }}>✓ {s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div style={{ padding: '12px', background: '#f8fafc', borderRadius: 8 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Possible Reasons</p>
                      <p style={{ fontSize: 13, lineHeight: 1.6 }}>{r.possible_reasons}</p>
                    </div>
                    <div style={{ padding: '12px', background: '#eaf6ff', borderRadius: 8 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recommended Nutrients</p>
                      <p style={{ fontSize: 13, lineHeight: 1.6 }}>{r.recommended_nutrients}</p>
                    </div>
                  </div>

                  <div style={{ padding: '12px 14px', background: '#f0faf0', borderRadius: 8, border: '1px solid #c8e6c9' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#1e8449', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🍎 Recommended Foods</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {r.recommended_foods?.split(',').map((food, fi) => (
                        <span key={fi} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: 'white', border: '1px solid #c8e6c9', color: '#2e7d32' }}>
                          {food.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              <div className="alert alert-info" style={{ marginTop: 8 }}>
                <span style={{ fontSize: 16 }}>⚕️</span>
                <span style={{ fontSize: 13 }}>This tool is for general guidance only. Please consult a qualified doctor or dietitian for proper diagnosis and treatment.</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
