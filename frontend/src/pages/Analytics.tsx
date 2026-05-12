import { useEffect, useState } from 'react';
import api from '../lib/api';
import { TrendingUp, Award, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function Analytics() {
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/team-performance'),
      api.get('/analytics/project-progress'),
    ]).then(([u, p]) => {
      setUsers(u.data.data);
      setProjects(p.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><span className="loading-spinner" /></div>;

  const perfData = users.slice(0, 10).map(u => ({ name: u.name?.split(' ')[0], score: u.performanceScore, tasks: u.tasksCompleted }));
  const projData = projects.map(p => ({ name: p.title?.substring(0, 12), progress: p.progress, est: p.estimatedHours, actual: p.actualHours }));

  return (
    <>
      <div className="page-header">
        <div><h2 className="page-title">Analytics</h2><p className="page-subtitle">Team performance & project progress</p></div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eff6ff' }}><TrendingUp size={22} color="#3b82f6" /></div>
          <div><div className="stat-value">{users.length}</div><div className="stat-label">Team Members</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f0fdf4' }}><Award size={22} color="#22c55e" /></div>
          <div><div className="stat-value">{users.length ? Math.round(users.reduce((s, u) => s + u.performanceScore, 0) / users.length) : 0}</div><div className="stat-label">Avg Performance</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f5f3ff' }}><Target size={22} color="#8b5cf6" /></div>
          <div><div className="stat-value">{projects.length}</div><div className="stat-label">Total Projects</div></div>
        </div>
      </div>

      <div className="charts-grid" style={{ marginBottom: 24 }}>
        <div className="chart-card">
          <div className="chart-title">Employee Performance Scores</div>
          {perfData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={perfData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="score" fill="#3b82f6" radius={[6,6,0,0]} name="Score" />
                <Bar dataKey="tasks" fill="#93c5fd" radius={[6,6,0,0]} name="Tasks" />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><p>No data yet</p></div>}
        </div>

        <div className="chart-card">
          <div className="chart-title">Project Progress</div>
          {projData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={projData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="progress" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} name="Progress %" />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><p>No data yet</p></div>}
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Team Performance Table</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Member</th><th>Role</th><th>Department</th><th>Performance</th><th>Tasks Done</th></tr></thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u._id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td><span className="badge badge-blue">{u.role}</span></td>
                  <td>{u.department || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-bar" style={{ width: 80 }}><div className="progress-fill" style={{ width: `${u.performanceScore}%` }} /></div>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{u.performanceScore}</span>
                    </div>
                  </td>
                  <td>{u.tasksCompleted}</td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={5}><div className="empty-state"><p>No data</p></div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
