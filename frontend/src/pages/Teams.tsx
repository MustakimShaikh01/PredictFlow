import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Plus, UserPlus, UserMinus, Users as UsersIcon } from 'lucide-react';

export default function Teams() {
  const [teams, setTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', department: '' });

  const load = () => { api.get('/teams').then(r => { setTeams(r.data.data); setLoading(false); }); };

  useEffect(() => {
    load();
    api.get('/users').then(r => setUsers(r.data.data)).catch(() => {});
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/teams', form);
    setShowModal(false);
    setForm({ name: '', description: '', department: '' });
    load();
  };

  const addMember = async (teamId: string, userId: string) => {
    await api.post(`/teams/${teamId}/members`, { userId });
    load();
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><span className="loading-spinner" /></div>;

  return (
    <>
      <div className="page-header">
        <div><h2 className="page-title">Teams</h2><p className="page-subtitle">{teams.length} teams</p></div>
        <button id="add-team-btn" className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> New Team</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
        {teams.map((team: any) => (
          <div className="card" key={team._id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UsersIcon size={20} color="#fff" />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{team.name}</h3>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>{team.department || 'No department'} · {team.members?.length || 0} members</span>
              </div>
            </div>

            {team.description && <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>{team.description}</p>}

            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10, fontWeight: 600 }}>Manager: {team.managerId?.name || '—'}</div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {(team.members || []).map((m: any) => (
                <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#eff6ff', padding: '4px 10px', borderRadius: 99, fontSize: 12, color: '#1d4ed8' }}>
                  <div className="user-avatar" style={{ width: 20, height: 20, fontSize: 9 }}>{m.name?.charAt(0)}</div>
                  {m.name}
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
              <select style={{ fontSize: 12, padding: '6px 10px' }} defaultValue="" onChange={e => { if (e.target.value) addMember(team._id, e.target.value); e.target.value = ''; }}>
                <option value="">+ Add member</option>
                {users.filter(u => !(team.members || []).find((m: any) => m._id === u._id)).map((u: any) => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
          </div>
        ))}
        {teams.length === 0 && <div className="empty-state"><h3>No teams</h3><p>Create your first team</p></div>}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">Create Team</h3><button className="btn-ghost" onClick={() => setShowModal(false)}>✕</button></div>
            <form onSubmit={create} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group"><label className="form-label">Team Name</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
              <div className="form-group"><label className="form-label">Description</label><textarea rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Department</label><input value={form.department} onChange={e => setForm({...form, department: e.target.value})} /></div>
              <button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center' }}>Create Team</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
