import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Plus, Edit3, Trash2, MessageSquare, Clock, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const STATUS_BADGES: Record<string, string> = { 'todo': 'badge-gray', 'in-progress': 'badge-blue', 'review': 'badge-yellow', 'completed': 'badge-green' };
const PRIORITY_BADGES: Record<string, string> = { 'low': 'badge-gray', 'medium': 'badge-blue', 'high': 'badge-yellow', 'critical': 'badge-red' };

export default function Tasks() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addNotification } = useAuthStore();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({ title: '', description: '', projectId: '', assignedTo: '', priority: 'medium', estimatedHours: 0, deadline: '' });
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const querySearch = new URLSearchParams(location.search).get('q') || '';

  const load = async (search = '') => {
    setLoading(true);
    try {
      const response = await api.get('/tasks', {
        params: search ? { search } : {},
      });
      setTasks(response.data.data);
    } catch (error) {
      console.error('Failed to load tasks', error);
      alert('Unable to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearchTerm(querySearch);
    load(querySearch);
    api.get('/projects').then(r => setProjects(r.data.data)).catch(() => {});
    api.get('/users').then(r => setUsers(r.data.data)).catch(() => {});
  }, [querySearch]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/tasks', form);
      setTasks(prev => [...prev, response.data.data]);
      addNotification('Task created', `Created task '${response.data.data.title}'`);
      setShowModal(false);
      setForm({ title: '', description: '', projectId: '', assignedTo: '', priority: 'medium', estimatedHours: 0, deadline: '' });
    } catch (error) {
      console.error('Task creation failed', error);
      alert('Unable to create task. Please try again.');
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await api.put(`/tasks/${id}`, { status });
      setTasks(prev => prev.map(task => task._id === id ? response.data.data : task));
      const task = tasks.find((task) => task._id === id);
      addNotification('Task updated', `Status changed for '${task?.title || 'task'}'`);
    } catch (error) {
      console.error('Status update failed', error);
      alert('Unable to update task status. Please try again.');
    }
  };

  const deleteTask = async (id: string) => {
    if (!confirm('Delete this task?')) return;

    try {
      const taskToDelete = tasks.find((task) => task._id === id);
      await api.delete(`/tasks/${id}`);
      setTasks(prev => prev.filter(task => task._id !== id));
      addNotification('Task deleted', `Deleted task '${taskToDelete?.title || 'task'}'`);
    } catch (error) {
      console.error('Delete task failed', error);
      alert('Unable to delete task. Please try again.');
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><span className="loading-spinner" /></div>;

  return (
    <>
      <div className="page-header" style={{ gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 className="page-title">Tasks</h2>
          <p className="page-subtitle">{tasks.length} total tasks</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="search"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && navigate(`/tasks${searchTerm ? `?q=${encodeURIComponent(searchTerm)}` : ''}`)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', minWidth: 240 }}
          />
          <button className="btn btn-secondary" type="button" onClick={() => navigate(`/tasks${searchTerm ? `?q=${encodeURIComponent(searchTerm)}` : ''}`)}>
            Search
          </button>
          <button id="add-task-btn" className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> New Task</button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Task</th><th>Project</th><th>Assignee</th><th>Priority</th><th>Status</th><th>Deadline</th><th>Actions</th></tr></thead>
            <tbody>
              {tasks.length === 0 ? <tr><td colSpan={7}><div className="empty-state"><h3>No tasks yet</h3><p>Create your first task</p></div></td></tr> :
                tasks.map((t: any) => (
                  <tr key={t._id}>
                    <td style={{ fontWeight: 600 }}>{t.title}</td>
                    <td>{t.projectId?.title || '—'}</td>
                    <td><div style={{ display:'flex', alignItems:'center', gap:6 }}><div className="user-avatar" style={{ width:24, height:24, fontSize:10 }}>{t.assignedTo?.name?.charAt(0) || '?'}</div>{t.assignedTo?.name || '—'}</div></td>
                    <td><span className={`badge ${PRIORITY_BADGES[t.priority]}`}>{t.priority}</span></td>
                    <td>
                      <select value={t.status} onChange={e => updateStatus(t._id, e.target.value)} style={{ padding:'4px 8px', fontSize:12, border:'1px solid #e2e8f0', borderRadius:6 }}>
                        <option value="todo">Todo</option><option value="in-progress">In Progress</option><option value="review">Review</option><option value="completed">Completed</option>
                      </select>
                    </td>
                    <td style={{ fontSize:13, color:'#64748b' }}><Clock size={12} /> {t.deadline ? new Date(t.deadline).toLocaleDateString() : '—'}</td>
                    <td>
                      <div style={{ display:'flex', gap:4 }}>
                        <button className="btn-ghost btn-icon" onClick={() => deleteTask(t._id)}><Trash2 size={14} color="#ef4444" /></button>
                      </div>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">Create Task</h3><button className="btn-ghost" onClick={() => setShowModal(false)}>✕</button></div>
            <form onSubmit={create} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="form-group"><label className="form-label">Title</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required /></div>
              <div className="form-group"><label className="form-label">Description</label><textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Project</label>
                  <select value={form.projectId} onChange={e => setForm({...form, projectId: e.target.value})} required>
                    <option value="">Select project</option>{projects.map((p: any) => <option key={p._id} value={p._id}>{p.title}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Assign To</label>
                  <select value={form.assignedTo} onChange={e => setForm({...form, assignedTo: e.target.value})} required>
                    <option value="">Select user</option>{users.map((u: any) => <option key={u._id} value={u._id}>{u.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Priority</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Est. Hours</label>
                  <input type="number" min={0} value={form.estimatedHours} onChange={e => setForm({...form, estimatedHours: +e.target.value})} />
                </div>
              </div>
              <div className="form-group"><label className="form-label">Deadline</label><input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} required /></div>
              <button className="btn btn-primary" type="submit" style={{ width:'100%', justifyContent:'center' }}>Create Task</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
