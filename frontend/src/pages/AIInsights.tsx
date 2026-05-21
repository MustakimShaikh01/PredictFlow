import { useEffect, useState } from 'react';
import api from '../lib/api';
import {
  BrainCircuit, Sparkles, TrendingUp, Users, Loader2, Zap,
  Award, AlertTriangle, FileText, CheckSquare, PlusCircle
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function AIInsights() {
  const [tab, setTab] = useState<'predict' | 'team' | 'promo' | 'estimate' | 'risk' | 'description'>('predict');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const { addNotification } = useAuthStore();

  // Predict completion form
  const [predForm, setPredForm] = useState({ projectId: '', complexity: 'medium', teamSize: 3, estimatedHours: 40 });

  // Team recommendation form
  const [teamForm, setTeamForm] = useState({ skills: '', projectType: '' });

  // Story point estimator form
  const [estForm, setEstForm] = useState({ title: '', description: '' });

  // Project risk form
  const [riskForm, setRiskForm] = useState({ projectId: '' });

  // Description generator form
  const [descForm, setDescForm] = useState({ title: '', tone: 'Professional' });

  useEffect(() => {
    api.get('/projects')
      .then(r => {
        setProjects(r.data.data);
        if (r.data.data.length > 0) {
          setPredForm(prev => ({ ...prev, projectId: r.data.data[0]._id }));
          setRiskForm({ projectId: r.data.data[0]._id });
        }
      })
      .catch(() => {});
  }, []);

  const predictCompletion = async () => {
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post('/ai/predict/completion', predForm);
      setResult(data.data);
      addNotification('AI Prediction Ready', 'Completion days predicted successfully');
    } catch (e: any) {
      setResult({ error: e.response?.data?.message || 'Failed to predict completion days' });
    } finally {
      setLoading(false);
    }
  };

  const recommendTeam = async () => {
    if (!teamForm.skills) {
      alert('Please specify required skills.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post('/ai/recommend/team', {
        skills: teamForm.skills.split(',').map(s => s.trim()),
        projectType: teamForm.projectType
      });
      setResult(data.data);
      addNotification('AI Team Recommended', 'Recommended optimal team constellation');
    } catch (e: any) {
      setResult({ error: e.response?.data?.message || 'Failed to get team recommendation' });
    } finally {
      setLoading(false);
    }
  };

  const analyzePromotion = async () => {
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.get('/ai/analyze/performance');
      setResult(data.data);
      addNotification('AI Analysis Complete', 'Promotion scoring and review ready');
    } catch (e: any) {
      setResult({ error: e.response?.data?.message || 'Failed to analyze employee performance' });
    } finally {
      setLoading(false);
    }
  };

  const estimateStoryPoints = async () => {
    if (!estForm.title) {
      alert('Please provide a task title.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post('/ai/estimate/task', estForm);
      setResult(data.data);
      addNotification('AI Estimate Ready', 'Story points and subtasks estimated');
    } catch (e: any) {
      setResult({ error: e.response?.data?.message || 'Failed to estimate task characteristics' });
    } finally {
      setLoading(false);
    }
  };

  const analyzeRisk = async () => {
    if (!riskForm.projectId) {
      alert('Please select a project.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post('/ai/predict/risk', riskForm);
      setResult(data.data);
      addNotification('AI Risk Assessment Ready', 'Project risk analysis calculated');
    } catch (e: any) {
      setResult({ error: e.response?.data?.message || 'Failed to run project risk assessment' });
    } finally {
      setLoading(false);
    }
  };

  const generateDescription = async () => {
    if (!descForm.title) {
      alert('Please provide a task title.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post('/ai/generate/description', descForm);
      setResult(data.data);
      addNotification('AI Description Drafted', 'Professional task structure generated');
    } catch (e: any) {
      setResult({ error: e.response?.data?.message || 'Failed to generate task description' });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'predict' as const, label: 'Completion Prediction', icon: Sparkles, color: '#3b82f6' },
    { id: 'team' as const, label: 'Team Recommendation', icon: Users, color: '#8b5cf6' },
    { id: 'promo' as const, label: 'Performance Review', icon: Award, color: '#10b981' },
    { id: 'estimate' as const, label: 'Story Point Estimator', icon: CheckSquare, color: '#f59e0b' },
    { id: 'risk' as const, label: 'Risk Analysis', icon: AlertTriangle, color: '#ef4444' },
    { id: 'description' as const, label: 'Task Draft Generator', icon: FileText, color: '#06b6d4' },
  ];

  return (
    <>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BrainCircuit size={28} color="#3b82f6" /> PredictFlow AI Insights
          </h2>
          <p className="page-subtitle">Scale your team with futuristic, automated predictions & project optimization tools</p>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
        {tabs.map(t => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              className="btn"
              style={{
                background: isActive ? t.color : '#fff',
                color: isActive ? '#fff' : '#475569',
                borderColor: isActive ? t.color : '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s',
                boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
              }}
              onClick={() => { setTab(t.id); setResult(null); }}
            >
              <t.icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(360px, 1.25fr)', gap: 24, alignItems: 'start' }}>
        {/* INPUT PANEL */}
        <div className="card" style={{ padding: 24, background: '#ffffff', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, borderBottom: '1px solid #f1f5f9', paddingBottom: 16 }}>
            {tabs.find(t => t.id === tab)?.icon({ size: 22, color: tabs.find(t => t.id === tab)?.color })}
            <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
              {tab === 'predict' && 'Completion Predictor'}
              {tab === 'team' && 'Smart Team Constellation'}
              {tab === 'promo' && 'Performance & Promotion Analyzer'}
              {tab === 'estimate' && 'Story Point & Subtask Estimator'}
              {tab === 'risk' && 'Project Risk Assessment'}
              {tab === 'description' && 'AI Description Draftsman'}
            </span>
          </div>

          {tab === 'predict' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Reference Project (optional)</label>
                <select value={predForm.projectId} onChange={e => setPredForm({ ...predForm, projectId: e.target.value })}>
                  <option value="">None (generic project metrics)</option>
                  {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Task Complexity</label>
                <select value={predForm.complexity} onChange={e => setPredForm({ ...predForm, complexity: e.target.value })}>
                  <option value="low">Low Complexity</option>
                  <option value="medium">Medium Complexity</option>
                  <option value="high">High Complexity</option>
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Active Team Size</label>
                  <input type="number" min={1} value={predForm.teamSize} onChange={e => setPredForm({ ...predForm, teamSize: +e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Estimated Hours</label>
                  <input type="number" min={1} value={predForm.estimatedHours} onChange={e => setPredForm({ ...predForm, estimatedHours: +e.target.value })} />
                </div>
              </div>
              <button className="btn btn-primary" onClick={predictCompletion} disabled={loading} style={{ width: '100%', justifyContent: 'center', background: '#3b82f6', borderColor: '#3b82f6' }}>
                {loading ? <Loader2 size={16} className="loading-spinner" /> : <><Zap size={16} /> Predict Completion Days</>}
              </button>
            </div>
          )}

          {tab === 'team' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Required Tech Skills (comma-separated)</label>
                <input placeholder="React, Node.js, Mongoose, Python" value={teamForm.skills} onChange={e => setTeamForm({ ...teamForm, skills: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Project Domain/Type</label>
                <input placeholder="Fintech Dashboard, Mobile UI, Web3 App" value={teamForm.projectType} onChange={e => setTeamForm({ ...teamForm, projectType: e.target.value })} />
              </div>
              <button className="btn btn-primary" onClick={recommendTeam} disabled={loading} style={{ width: '100%', justifyContent: 'center', background: '#8b5cf6', borderColor: '#8b5cf6' }}>
                {loading ? <Loader2 size={16} className="loading-spinner" /> : <><Users size={16} /> Get Ideal Constellation</>}
              </button>
            </div>
          )}

          {tab === 'promo' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.5 }}>
                Run an automated performance screening algorithm assessing overall developer activity, task fulfillment speeds, years of experience, and historical reviews to identify stellar promotion candidates.
              </p>
              <button className="btn btn-primary" onClick={analyzePromotion} disabled={loading} style={{ width: '100%', justifyContent: 'center', background: '#10b981', borderColor: '#10b981' }}>
                {loading ? <Loader2 size={16} className="loading-spinner" /> : <><Award size={16} /> Screen Promotion Candidates</>}
              </button>
            </div>
          )}

          {tab === 'estimate' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Task Title</label>
                <input placeholder="Implement JWT multi-tenant token refresh" value={estForm.title} onChange={e => setEstForm({ ...estForm, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Brief Scope Description</label>
                <textarea rows={3} placeholder="Describe the feature goals briefly..." value={estForm.description} onChange={e => setEstForm({ ...estForm, description: e.target.value })} />
              </div>
              <button className="btn btn-primary" onClick={estimateStoryPoints} disabled={loading} style={{ width: '100%', justifyContent: 'center', background: '#f59e0b', borderColor: '#f59e0b' }}>
                {loading ? <Loader2 size={16} className="loading-spinner" /> : <><CheckSquare size={16} /> Estimate Story Points & Tasks</>}
              </button>
            </div>
          )}

          {tab === 'risk' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Target Project to Analyze</label>
                <select value={riskForm.projectId} onChange={e => setRiskForm({ projectId: e.target.value })}>
                  <option value="">Select project...</option>
                  {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                </select>
              </div>
              <button className="btn btn-primary" onClick={analyzeRisk} disabled={loading} style={{ width: '100%', justifyContent: 'center', background: '#ef4444', borderColor: '#ef4444' }}>
                {loading ? <Loader2 size={16} className="loading-spinner" /> : <><AlertTriangle size={16} /> Run Operational Risk Audit</>}
              </button>
            </div>
          )}

          {tab === 'description' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Task Target Outcome</label>
                <input placeholder="Setup Redis cache storage system" value={descForm.title} onChange={e => setDescForm({ ...descForm, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Draft Tone</label>
                <select value={descForm.tone} onChange={e => setDescForm({ ...descForm, tone: e.target.value })}>
                  <option value="Professional">Professional Standard</option>
                  <option value="Technical">Technical/Developer Intensive</option>
                  <option value="Concise">Short &amp; Concise Bulletins</option>
                </select>
              </div>
              <button className="btn btn-primary" onClick={generateDescription} disabled={loading} style={{ width: '100%', justifyContent: 'center', background: '#06b6d4', borderColor: '#06b6d4' }}>
                {loading ? <Loader2 size={16} className="loading-spinner" /> : <><FileText size={16} /> Generate Task Structure</>}
              </button>
            </div>
          )}
        </div>

        {/* RESULTS PANEL */}
        <div className="card" style={{ padding: 24, borderRadius: 16, minHeight: 340, background: '#ffffff', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} color="#3b82f6" /> AI Generated Resolution
          </h3>

          {!result && (
            <div className="empty-state" style={{ minHeight: 280, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <BrainCircuit size={48} color="#bfdbfe" style={{ animation: 'pulse 2s infinite', marginBottom: 16 }} />
              <h3>Awaiting Parameters</h3>
              <p>Configure options and run the PredictFlow AI query to generate optimized resolutions here.</p>
            </div>
          )}

          {result?.error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 12, padding: 16, fontSize: 14 }}>
              <strong>Execution Error:</strong> {result.error}
            </div>
          )}

          {result && !result.error && (
            <div style={{ transition: 'opacity 0.2s' }}>
              {/* 1. Predict Days */}
              {tab === 'predict' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', padding: 24, borderRadius: 16, textAlign: 'center', border: '1px solid #bfdbfe' }}>
                    <div style={{ fontSize: 64, fontWeight: 800, color: '#1e40af', lineHeight: 1 }}>{result.predictedDays}</div>
                    <div style={{ fontSize: 14, color: '#1e3a8a', fontWeight: 600, marginTop: 8 }}>Optimal Days Estimate</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 14, borderRadius: 12 }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#334155' }}>{Math.round((result.confidence || 0) * 100)}%</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Prediction Confidence</div>
                    </div>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 14, borderRadius: 12 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#334155', textTransform: 'capitalize' }}>{result.source || 'AI Engine'}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Calculation Path</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Recommend Team */}
              {tab === 'team' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 8px 0' }}>Ideal developer constellation matching requested profile, ordered by compatibility index:</p>
                  {result.recommended?.map((u: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: i === 0 ? '#f5f3ff' : '#f8fafc', border: i === 0 ? '1px solid #ddd6fe' : '1px solid #f1f5f9', borderRadius: 12 }}>
                      <div className="user-avatar" style={{ background: i === 0 ? '#8b5cf6' : '#64748b' }}>{u.name?.charAt(0)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>{u.name}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{u.role} · performance index: <strong>{u.performanceScore}%</strong></div>
                      </div>
                      <span className="badge" style={{ background: i === 0 ? '#8b5cf6' : '#e2e8f0', color: i === 0 ? '#fff' : '#475569' }}>Rank #{i + 1}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 3. Promo candidates */}
              {tab === 'promo' && Array.isArray(result) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {result.map((r: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12 }}>
                      <div className="user-avatar">{r.user?.name?.charAt(0) || '?'}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>{r.user?.name}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>Promotion Readiness Index: <strong>{Math.round(r.promotionScore)}/100</strong></div>
                      </div>
                      <span className={`badge ${r.recommendation === 'Promote' ? 'badge-green' : r.recommendation === 'Review' ? 'badge-yellow' : 'badge-gray'}`}>
                        {r.recommendation}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* 4. Story Point Estimator */}
              {tab === 'estimate' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: 16, borderRadius: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 32, fontWeight: 800, color: '#d97706' }}>{result.storyPoints}</div>
                      <div style={{ fontSize: 12, color: '#b45309', fontWeight: 600, marginTop: 4 }}>Estimated Story Points</div>
                    </div>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 16, borderRadius: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 32, fontWeight: 800, color: '#475569' }}>{result.estimatedHours}h</div>
                      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginTop: 4 }}>Optimal Hours</div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Suggested Subtasks Breakdown:</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {result.subtasks?.map((sub: string, index: number) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#475569', background: '#f8fafc', padding: '10px 14px', borderRadius: 8 }}>
                          <PlusCircle size={14} color="#f59e0b" style={{ flexShrink: 0 }} />
                          {sub}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: 14, borderRadius: 12, fontSize: 13, color: '#64748b', border: '1px solid #e2e8f0', lineHeight: 1.5 }}>
                    <strong>Complexity Rank:</strong> <span style={{ textTransform: 'capitalize', color: '#0f172a', fontWeight: 600 }}>{result.complexity}</span>
                    <p style={{ margin: '8px 0 0 0' }}>{result.aiExplanation}</p>
                  </div>
                </div>
              )}

              {/* 5. Project Risk Analysis */}
              {tab === 'risk' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, background: result.riskLevel === 'Critical' ? '#fef2f2' : result.riskLevel === 'Medium' ? '#fffbeb' : '#f0fdf4', border: `1px solid ${result.riskLevel === 'Critical' ? '#fecaca' : result.riskLevel === 'Medium' ? '#fde68a' : '#bbf7d0'}` }}>
                    <div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>Operational Risk Index</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: result.riskLevel === 'Critical' ? '#b91c1c' : result.riskLevel === 'Medium' ? '#b45309' : '#15803d' }}>{result.riskLevel} ({result.riskScore}%)</div>
                    </div>
                    <AlertTriangle size={32} color={result.riskLevel === 'Critical' ? '#ef4444' : result.riskLevel === 'Medium' ? '#f59e0b' : '#10b981'} />
                  </div>

                  <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, margin: 0 }}>{result.summary}</p>

                  {/* Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, fontSize: 12 }}>
                      <span style={{ color: '#64748b' }}>Total Tasks:</span> <strong>{result.stats?.totalTasks}</strong>
                    </div>
                    <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, fontSize: 12 }}>
                      <span style={{ color: '#64748b' }}>Completed:</span> <strong style={{ color: '#16a34a' }}>{result.stats?.completedTasks}</strong>
                    </div>
                    <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, fontSize: 12 }}>
                      <span style={{ color: '#64748b' }}>Overdue Tasks:</span> <strong style={{ color: '#dc2626' }}>{result.stats?.overdueTasks}</strong>
                    </div>
                    <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, fontSize: 12 }}>
                      <span style={{ color: '#64748b' }}>Critical Pending:</span> <strong style={{ color: '#d97706' }}>{result.stats?.criticalPending}</strong>
                    </div>
                  </div>

                  {/* Bottlenecks */}
                  {result.bottlenecks?.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        ⚠️ Team Resource Bottlenecks:
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {result.bottlenecks.map((b: any, index: number) => (
                          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fffbeb', padding: '10px 14px', borderRadius: 8, fontSize: 13, border: '1px solid #fef3c7' }}>
                            <span style={{ fontWeight: 600, color: '#92400e' }}>{b.name}</span>
                            <span style={{ fontSize: 11, color: '#b45309' }}>{b.count} active pending · {b.overdue} overdue</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 6. Description Draftsman */}
              {tab === 'description' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: '#64748b' }}>Generated Draft structure:</span>
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(result.description);
                        addNotification('Copied', 'Description draft copied to clipboard');
                      }}
                    >
                      Copy to Clipboard
                    </button>
                  </div>
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    padding: 16,
                    borderRadius: 12,
                    fontSize: 13,
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    color: '#334155',
                    maxHeight: 340,
                    overflowY: 'auto',
                    lineHeight: 1.5,
                  }}>
                    {result.description}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
