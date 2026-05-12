import { useEffect, useState } from 'react';
import api from '../lib/api';
import { ListTodo, CheckCircle2, Clock, AlertTriangle, FolderKanban, Users, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/dashboard').then(r => { setStats(r.data.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><span className="loading-spinner" /></div>;

  const s = stats || {};
  const statusData = (s.tasksByStatus || []).map((t: any) => ({ name: t._id, value: t.count }));
  const priorityData = (s.tasksByPriority || []).map((t: any) => ({ name: t._id, value: t.count }));

  const statCards = [
    { label: 'Total Tasks', value: s.totalTasks || 0, icon: ListTodo, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Completed', value: s.completedTasks || 0, icon: CheckCircle2, color: '#22c55e', bg: '#f0fdf4' },
    { label: 'Overdue', value: s.overdueTasks || 0, icon: AlertTriangle, color: '#ef4444', bg: '#fef2f2' },
    { label: 'Active Projects', value: s.activeProjects || 0, icon: FolderKanban, color: '#8b5cf6', bg: '#f5f3ff' },
    { label: 'Team Members', value: s.totalUsers || 0, icon: Users, color: '#0ea5e9', bg: '#f0f9ff' },
    { label: 'Completion Rate', value: `${s.completionRate || 0}%`, icon: TrendingUp, color: '#f59e0b', bg: '#fffbeb' },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">Overview of your workspace</p>
        </div>
      </div>

      <div className="stat-grid">
        {statCards.map((c, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-icon" style={{ background: c.bg }}>
              <c.icon size={22} color={c.color} />
            </div>
            <div>
              <div className="stat-value">{c.value}</div>
              <div className="stat-label">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">Tasks by Status</div>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><p>No task data yet</p></div>}
        </div>

        <div className="chart-card">
          <div className="chart-title">Tasks by Priority</div>
          {priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={priorityData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {priorityData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><p>No task data yet</p></div>}
        </div>
      </div>
    </>
  );
}
