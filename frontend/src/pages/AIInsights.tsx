import { useState } from 'react';
import api from '../lib/api';
import { BrainCircuit, Sparkles, TrendingUp, Users, Loader2, Zap, Award } from 'lucide-react';

export default function AIInsights() {
  const [tab, setTab] = useState<'predict' | 'team' | 'promo'>('predict');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Predict form
  const [predForm, setPredForm] = useState({ projectId: '', complexity: 'medium', teamSize: 3, estimatedHours: 40 });

  // Team recommendation
  const [teamForm, setTeamForm] = useState({ skills: '', projectType: '' });

  const predictCompletion = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/ai/predict/completion', predForm);
      setResult(data.data);
    } catch (e: any) { setResult({ error: e.response?.data?.message || 'Failed' }); }
    setLoading(false);
  };

  const recommendTeam = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/ai/recommend/team', { skills: teamForm.skills.split(',').map(s => s.trim()), projectType: teamForm.projectType });
      setResult(data.data);
    } catch (e: any) { setResult({ error: e.response?.data?.message || 'Failed' }); }
    setLoading(false);
  };

  const analyzePromotion = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/ai/analyze/performance');
      setResult(data.data);
    } catch (e: any) { setResult({ error: e.response?.data?.message || 'Failed' }); }
    setLoading(false);
  };

  const tabs = [
    { id: 'predict' as const, label: 'Completion Prediction', icon: Sparkles },
    { id: 'team' as const, label: 'Team Recommendation', icon: Users },
    { id: 'promo' as const, label: 'Promotion Analysis', icon: Award },
  ];

  return (
    <>
      <div className="page-header">
        <div><h2 className="page-title">AI Insights</h2><p className="page-subtitle">Intelligent predictions & recommendations</p></div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {tabs.map(t => (
          <button key={t.id} className={`btn ${tab === t.id ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setTab(t.id); setResult(null); }}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* INPUT PANEL */}
        <div className="ai-panel">
          <div className="ai-panel-header">
            <BrainCircuit size={20} color="#2563eb" />
            <span className="ai-panel-title">
              {tab === 'predict' ? 'Predict Completion Time' : tab === 'team' ? 'Smart Team Builder' : 'Promotion Recommendations'}
            </span>
          </div>

          {tab === 'predict' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group"><label className="form-label">Complexity</label>
                <select value={predForm.complexity} onChange={e => setPredForm({...predForm, complexity: e.target.value})}>
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                </select>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Team Size</label>
                  <input type="number" min={1} value={predForm.teamSize} onChange={e => setPredForm({...predForm, teamSize: +e.target.value})} />
                </div>
                <div className="form-group"><label className="form-label">Estimated Hours</label>
                  <input type="number" min={1} value={predForm.estimatedHours} onChange={e => setPredForm({...predForm, estimatedHours: +e.target.value})} />
                </div>
              </div>
              <button className="btn btn-primary" onClick={predictCompletion} disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? <Loader2 size={16} className="loading-spinner" /> : <><Zap size={16} /> Predict</>}
              </button>
            </div>
          )}

          {tab === 'team' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group"><label className="form-label">Required Skills (comma-separated)</label>
                <input placeholder="React, Node.js, Python" value={teamForm.skills} onChange={e => setTeamForm({...teamForm, skills: e.target.value})} />
              </div>
              <div className="form-group"><label className="form-label">Project Type</label>
                <input placeholder="Web App, Mobile, API" value={teamForm.projectType} onChange={e => setTeamForm({...teamForm, projectType: e.target.value})} />
              </div>
              <button className="btn btn-primary" onClick={recommendTeam} disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? <Loader2 size={16} className="loading-spinner" /> : <><Users size={16} /> Get Recommendations</>}
              </button>
            </div>
          )}

          {tab === 'promo' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 14, color: '#475569' }}>Analyze all team members based on performance, task completion, and experience to generate promotion recommendations.</p>
              <button className="btn btn-primary" onClick={analyzePromotion} disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? <Loader2 size={16} className="loading-spinner" /> : <><TrendingUp size={16} /> Analyze Performance</>}
              </button>
            </div>
          )}
        </div>

        {/* RESULTS PANEL */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Sparkles size={18} color="#3b82f6" /> Results</h3>

          {!result && <div className="empty-state"><BrainCircuit size={40} color="#bfdbfe" /><h3>No results yet</h3><p>Run an AI analysis to see results</p></div>}

          {result?.error && <div className="auth-error">{result.error}</div>}

          {result && !result.error && tab === 'predict' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ textAlign: 'center', padding: 20 }}>
                <div style={{ fontSize: 48, fontWeight: 800, color: '#2563eb' }}>{result.predictedDays}</div>
                <div style={{ fontSize: 14, color: '#64748b' }}>Predicted Days</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: '#eff6ff', padding: 14, borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#1e40af' }}>{Math.round((result.confidence || 0) * 100)}%</div>
                  <div style={{ fontSize: 12, color: '#3b82f6' }}>Confidence</div>
                </div>
                <div style={{ background: '#f0fdf4', padding: 14, borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#16a34a' }}>{result.source || 'AI'}</div>
                  <div style={{ fontSize: 12, color: '#22c55e' }}>Source</div>
                </div>
              </div>
            </div>
          )}

          {result && !result.error && tab === 'team' && result.recommended && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {result.recommended.map((u: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: i === 0 ? '#eff6ff' : '#f8fafc', borderRadius: 10 }}>
                  <div className="user-avatar">{u.name?.charAt(0)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{u.role} · Score: {u.performanceScore}</div>
                  </div>
                  <span className="badge badge-blue">#{i + 1}</span>
                </div>
              ))}
            </div>
          )}

          {result && !result.error && tab === 'promo' && Array.isArray(result) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {result.map((r: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#f8fafc', borderRadius: 10 }}>
                  <div className="user-avatar">{r.user?.name?.charAt(0) || '?'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{r.user?.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Score: {Math.round(r.promotionScore)}</div>
                  </div>
                  <span className={`badge ${r.recommendation === 'Promote' ? 'badge-green' : r.recommendation === 'Review' ? 'badge-yellow' : 'badge-gray'}`}>
                    {r.recommendation}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
