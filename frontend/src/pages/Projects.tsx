import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Plus, Calendar, Users, Trash2 } from 'lucide-react';

const STATUS_BADGES: Record<string, string> = { 'planning': 'badge-gray', 'active': 'badge-blue', 'review': 'badge-yellow', 'completed': 'badge-green', 'on-hold': 'badge-red' };

export default function Projects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', deadline: '', teamId: '', priority: 'medium' });

  const load = () => { api.get('/projects').then(r => { setProjects(r.data.data); setLoading(false); }); };

  useEffect(() => {
    load();
    api.get('/teams').then(r => setTeams(r.data.data)).catch(() => {});
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/projects', form);
    setShowModal(false);
    setForm({ title: '', description: '', deadline: '', teamId: '', priority: 'medium' });
    load();
  };

  const deleteProject = async (id: string) => {
    if (confirm('Delete project and all its tasks?')) { await api.delete(`/projects/${id}`); load(); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><span className="loading-spinner" /></div>;

  return (
    <>
      <div className="page-header">
        <div><h2 className="page-title">Projects</h2><p className="page-subtitle">{projects.length} projects</p></div>
        <button id="add-project-btn" className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> New Project</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {projects.map((p: any) => (
          <div className="card card-hover" key={p._id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{p.title}</h3>
                <span className={`badge ${STATUS_BADGES[p.status]}`}>{p.status}</span>
              </div>
              <button className="btn-ghost btn-icon" onClick={() => deleteProject(p._id)}><Trash2 size={14} color="#ef4444" /></button>
            </div>
            {p.description && <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12, lineHeight: 1.5 }}>{p.description}</p>}
            <div className="progress-bar" style={{ marginBottom: 12 }}><div className="progress-fill" style={{ width: `${p.progress}%` }} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} />{p.deadline ? new Date(p.deadline).toLocaleDateString() : '—'}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={12} />{p.teamId?.name || '—'}</span>
              <span>{p.progress}% done</span>
            </div>
          </div>
        ))}
        {projects.length === 0 && <div className="empty-state"><h3>No projects</h3><p>Create your first project</p></div>}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">Create Project</h3><button className="btn-ghost" onClick={() => setShowModal(false)}>✕</button></div>
            <form onSubmit={create} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group"><label className="form-label">Title</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required /></div>
              <div className="form-group"><label className="form-label">Description</label><textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Team</label>
                  <select value={form.teamId} onChange={e => setForm({...form, teamId: e.target.value})} required>
                    <option value="">Select team</option>{teams.map((t: any) => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Deadline</label>
                  <input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} required />
                </div>
              </div>
              <button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center' }}>Create Project</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
